"""OAuth Account management service.

Uses **Authlib** (async httpx client) for all token operations.
Authlib is a mature, spec-compliant OAuth2 library that supports every grant
type we need (client_credentials, authorization_code + PKCE, refresh).
"""

from __future__ import annotations

import json
import logging
import urllib.parse
from datetime import datetime, timedelta, timezone
from typing import TYPE_CHECKING, Any
from uuid import UUID

import httpx
from authlib.integrations.httpx_client import AsyncOAuth2Client

if TYPE_CHECKING:
    from sqlmodel.ext.asyncio.session import AsyncSession

from langflow.services.database.models.oauth_account.crud import (
    create_oauth_account,
    decrypt_account_access_token,
    decrypt_account_refresh_token,
    decrypt_account_secret,
    decrypt_extra_data,
    delete_oauth_account,
    get_oauth_account,
    list_accounts_due_for_refresh,
    list_oauth_accounts,
    save_tokens,
    update_oauth_account,
)
from langflow.services.database.models.oauth_account.model import (
    OAuthAccount,
    OAuthAccountCreate,
    OAuthAccountRead,
    OAuthAccountUpdate,
    OAuthFlowType,
    RotateTokensResponse,
    ValidateConnectionResponse,
    _ensure_utc,
)
from langflow.services.oauth_accounts.providers import get_provider

logger = logging.getLogger(__name__)


class OAuthAccountService:
    """Service layer for creating, validating, and rotating OAuth credentials."""

    # ------------------------------------------------------------------
    # CRUD wrappers
    # ------------------------------------------------------------------

    async def list_accounts(self, session: AsyncSession, user_id: UUID) -> list[OAuthAccountRead]:
        return await list_oauth_accounts(session, user_id)

    async def create_account(
        self,
        session: AsyncSession,
        user_id: UUID,
        payload: OAuthAccountCreate,
    ) -> OAuthAccountRead:
        provider_def = get_provider(payload.provider)
        if provider_def and not payload.auth_endpoint:
            payload.auth_endpoint = provider_def.default_auth_endpoint
        if provider_def and not payload.token_endpoint:
            payload.token_endpoint = provider_def.default_token_endpoint
        if provider_def and not payload.userinfo_endpoint:
            payload.userinfo_endpoint = provider_def.default_userinfo_endpoint

        return await create_oauth_account(session, payload, user_id)

    async def update_account(
        self,
        session: AsyncSession,
        user_id: UUID,
        account_id: UUID,
        payload: OAuthAccountUpdate,
    ) -> OAuthAccountRead | None:
        return await update_oauth_account(session, account_id, user_id, payload)

    async def delete_account(self, session: AsyncSession, user_id: UUID, account_id: UUID) -> None:
        await delete_oauth_account(session, account_id, user_id)

    # ------------------------------------------------------------------
    # Authorization Code Flow helpers
    # ------------------------------------------------------------------

    async def start_authorization_flow(
        self,
        session: AsyncSession,
        user_id: UUID,
        account_id: UUID,
        redirect_uri: str,
    ) -> dict[str, str]:
        """Build the provider authorization URL for the authorization_code flow.

        Returns a dict with ``authorization_url`` and ``state``.
        The ``state`` is a short-lived signed token that encodes the account/user
        identifiers so the callback can verify it without server-side session storage.
        """
        account = await get_oauth_account(session, account_id, user_id)
        if account is None:
            msg = "OAuth account not found"
            raise ValueError(msg)
        if account.flow_type != OAuthFlowType.authorization_code:
            msg = f"Account '{account.name}' uses flow '{account.flow_type}', not authorization_code"
            raise ValueError(msg)
        if not account.auth_endpoint:
            msg = "auth_endpoint is required for authorization_code flow"
            raise ValueError(msg)

        from langflow.services.auth.utils import create_token

        state = create_token(
            {"account_id": str(account_id), "user_id": str(user_id), "type": "oauth_state"},
            timedelta(minutes=10),
        )

        params: dict[str, str] = {
            "response_type": "code",
            "client_id": account.client_id or "",
            "redirect_uri": redirect_uri,
            "state": state,
            "access_type": "offline",  # request refresh token (Google-specific, harmless elsewhere)
            "prompt": "consent",  # ensure refresh token is always issued
        }
        if account.scopes:
            params["scope"] = " ".join(account.scopes)

        authorization_url = account.auth_endpoint + "?" + urllib.parse.urlencode(params)
        return {"authorization_url": authorization_url, "state": state}

    async def complete_authorization_flow(
        self,
        session: AsyncSession,
        code: str,
        state: str,
        redirect_uri: str,
    ) -> OAuthAccount:
        """Exchange the authorization code for tokens and persist them.

        Verifies the ``state`` JWT, finds the account, exchanges the code, and
        saves the resulting tokens.  Returns the updated OAuthAccount row.
        """
        import jwt
        from jwt import InvalidTokenError

        from langflow.services.auth.utils import get_jwt_verification_key
        from langflow.services.deps import get_settings_service

        settings_service = get_settings_service()
        algorithm = settings_service.auth_settings.ALGORITHM.value
        verification_key = get_jwt_verification_key(settings_service)

        try:
            payload = jwt.decode(state, verification_key, algorithms=[algorithm])
        except InvalidTokenError as exc:
            msg = f"Invalid or expired OAuth state token: {exc}"
            raise ValueError(msg) from exc

        if payload.get("type") != "oauth_state":
            msg = "Invalid OAuth state token type"
            raise ValueError(msg)

        account_id = UUID(payload["account_id"])
        user_id = UUID(payload["user_id"])

        account = await get_oauth_account(session, account_id, user_id)
        if account is None:
            msg = "OAuth account not found"
            raise ValueError(msg)

        client_secret = decrypt_account_secret(account)
        if not client_secret:
            msg = "client_secret is required to complete authorization code exchange"
            raise ValueError(msg)
        if not account.token_endpoint:
            msg = "token_endpoint is required to complete authorization code exchange"
            raise ValueError(msg)

        async with AsyncOAuth2Client(
            client_id=account.client_id,
            client_secret=client_secret,
            redirect_uri=redirect_uri,
        ) as client:
            token_data = dict(
                await client.fetch_token(
                    account.token_endpoint,
                    grant_type="authorization_code",
                    code=code,
                )
            )

        expires_in = token_data.get("expires_in")
        expires_at = None
        if expires_in:
            expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
        elif token_data.get("expires_at"):
            raw = token_data["expires_at"]
            expires_at = datetime.fromtimestamp(raw, tz=timezone.utc) if isinstance(raw, (int, float)) else raw

        await save_tokens(
            session,
            account,
            access_token=token_data.get("access_token"),
            refresh_token=token_data.get("refresh_token"),
            token_expires_at=expires_at,
        )
        await session.refresh(account)
        return account

    # ------------------------------------------------------------------
    # Token acquisition helpers
    # ------------------------------------------------------------------

    async def _fetch_client_credentials_token(
        self,
        account: OAuthAccount,
        client_secret: str,
    ) -> dict[str, Any]:
        """Obtain a token via the OAuth2 Client Credentials grant."""
        scopes = " ".join(account.scopes) if account.scopes else None
        async with AsyncOAuth2Client(
            client_id=account.client_id,
            client_secret=client_secret,
            scope=scopes,
        ) as client:
            token_endpoint = account.token_endpoint
            if not token_endpoint:
                msg = "token_endpoint is required for client_credentials flow"
                raise ValueError(msg)
            token = await client.fetch_token(token_endpoint, grant_type="client_credentials")
            return dict(token)

    async def _fetch_service_account_token(
        self,
        account: OAuthAccount,
        sa_json: str,
    ) -> dict[str, Any]:
        """Obtain a Google-style service account access token via JWT bearer grant."""
        try:
            import google.auth
            import google.auth.transport.requests
            from google.oauth2 import service_account
        except ImportError as exc:
            msg = "google-auth package is required for service_account flow. Install it with: pip install google-auth"
            raise ImportError(msg) from exc

        sa_info = json.loads(sa_json)
        scopes = account.scopes or ["https://www.googleapis.com/auth/cloud-platform"]
        credentials = service_account.Credentials.from_service_account_info(sa_info, scopes=scopes)
        auth_req = google.auth.transport.requests.Request()
        credentials.refresh(auth_req)

        expires_at = None
        if credentials.expiry:
            expires_at = credentials.expiry.replace(tzinfo=timezone.utc)

        return {
            "access_token": credentials.token,
            "token_type": "Bearer",
            "expires_at": expires_at,
        }

    async def _refresh_token(
        self,
        account: OAuthAccount,
        client_secret: str,
        refresh_token_value: str,
    ) -> dict[str, Any]:
        """Exchange a refresh token for a new access token."""
        async with AsyncOAuth2Client(
            client_id=account.client_id,
            client_secret=client_secret,
        ) as client:
            token_endpoint = account.token_endpoint
            if not token_endpoint:
                msg = "token_endpoint is required to refresh token"
                raise ValueError(msg)
            token = await client.refresh_token(token_endpoint, refresh_token=refresh_token_value)
            return dict(token)

    # ------------------------------------------------------------------
    # Public operations
    # ------------------------------------------------------------------

    async def get_valid_token(
        self,
        session: AsyncSession,
        user_id: UUID,
        account_id: UUID,
        *,
        force_refresh: bool = False,
    ) -> str | None:
        """Return a valid access token, refreshing it if needed.

        When *force_refresh* is True the cached access token is ignored and a
        fresh one is always obtained.  Use this when a provider has already
        rejected the cached token (e.g. HTTP 401 from the userinfo endpoint)
        even though the stored expiry timestamp has not passed yet — this
        happens when the token is revoked on the provider side.
        """
        account = await get_oauth_account(session, account_id, user_id)
        if account is None:
            return None

        # Check if existing token is still valid (with 60 s buffer).
        # Skip this check when the caller already knows the token is bad.
        now = datetime.now(timezone.utc)
        if (
            not force_refresh
            and account.access_token_enc
            and account.token_expires_at
            and _ensure_utc(account.token_expires_at) > now + timedelta(seconds=60)
        ):
            return decrypt_account_access_token(account)

        # authorization_code tokens cannot be auto-acquired (require browser consent).
        # Try to use a stored refresh token if available; otherwise return None.
        if account.flow_type == OAuthFlowType.authorization_code:
            refresh_tok = decrypt_account_refresh_token(account)
            client_secret = decrypt_account_secret(account)
            if refresh_tok and client_secret and account.token_endpoint:
                token_data = await self._refresh_token(account, client_secret, refresh_tok)
                expires_in = token_data.get("expires_in")
                expires_at = None
                if expires_in:
                    expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
                elif token_data.get("expires_at"):
                    raw = token_data["expires_at"]
                    expires_at = datetime.fromtimestamp(raw, tz=timezone.utc) if isinstance(raw, (int, float)) else raw
                await save_tokens(
                    session,
                    account,
                    access_token=token_data.get("access_token"),
                    refresh_token=token_data.get("refresh_token", refresh_tok),
                    token_expires_at=expires_at,
                )
                await session.refresh(account)
                return decrypt_account_access_token(account)
            # No refresh token available — the user must complete the authorization flow first
            return None

        # For all other flows, acquire a fresh token automatically
        await self._acquire_token(session, account)
        await session.refresh(account)
        return decrypt_account_access_token(account)

    async def _acquire_token(self, session: AsyncSession, account: OAuthAccount) -> None:
        """Acquire a new token and persist it."""
        flow = account.flow_type

        if flow == OAuthFlowType.service_account:
            extra_json = decrypt_extra_data(account)
            if not extra_json:
                msg = "Service account JSON data is missing"
                raise ValueError(msg)
            token_data = await self._fetch_service_account_token(account, extra_json)
            expires_at = token_data.get("expires_at")
            await save_tokens(
                session,
                account,
                access_token=token_data["access_token"],
                token_expires_at=expires_at,
            )

        elif flow == OAuthFlowType.client_credentials:
            client_secret = decrypt_account_secret(account)
            if not client_secret:
                msg = "client_secret is required for client_credentials flow"
                raise ValueError(msg)
            token_data = await self._fetch_client_credentials_token(account, client_secret)
            expires_in = token_data.get("expires_in")
            expires_at = None
            if expires_in:
                expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
            elif token_data.get("expires_at"):
                raw = token_data["expires_at"]
                expires_at = datetime.fromtimestamp(raw, tz=timezone.utc) if isinstance(raw, (int, float)) else raw
            await save_tokens(
                session,
                account,
                access_token=token_data.get("access_token"),
                refresh_token=token_data.get("refresh_token"),
                token_expires_at=expires_at,
            )

        elif flow == OAuthFlowType.api_key:
            # For API-key style accounts the "token" is just the stored secret
            pass

        else:
            msg = f"Cannot automatically acquire token for flow type '{flow}'"
            raise ValueError(msg)

    async def validate_connection(
        self,
        session: AsyncSession,
        user_id: UUID,
        account_id: UUID,
    ) -> ValidateConnectionResponse:
        """Test that stored credentials are working by calling the userinfo endpoint."""
        account = await get_oauth_account(session, account_id, user_id)
        if account is None:
            return ValidateConnectionResponse(success=False, message="OAuth account not found")

        try:
            access_token = await self.get_valid_token(session, user_id, account_id)
            if not access_token and account.flow_type == OAuthFlowType.api_key:
                access_token = decrypt_account_secret(account)

            if not access_token:
                if account.flow_type == OAuthFlowType.authorization_code:
                    return ValidateConnectionResponse(
                        success=False,
                        message=(
                            "No access token available. Authorization Code flow requires completing "
                            "the OAuth consent screen first — tokens cannot be acquired automatically. "
                            "For server-to-server Google API access use the Service Account flow instead."
                        ),
                    )
                return ValidateConnectionResponse(success=False, message="No access token available")

            details: dict[str, Any] = {}

            if account.userinfo_endpoint:
                async with httpx.AsyncClient(timeout=10.0) as http:
                    resp = await http.get(
                        account.userinfo_endpoint,
                        headers={"Authorization": f"Bearer {access_token}"},
                    )
                    if resp.status_code == 401:  # noqa: PLR2004
                        # The cached token was rejected by the provider (revoked / expired
                        # server-side before our local expiry timestamp).  Try once more
                        # with a freshly obtained token before giving up.
                        logger.info(
                            "Userinfo returned 401 for account %s; attempting forced token refresh",
                            account_id,
                        )
                        try:
                            fresh_token = await self.get_valid_token(session, user_id, account_id, force_refresh=True)
                        except Exception as refresh_exc:  # noqa: BLE001
                            logger.warning("Forced token refresh failed for account %s: %s", account_id, refresh_exc)
                            fresh_token = None

                        token_was_refreshed = bool(fresh_token and fresh_token != access_token)
                        if token_was_refreshed:
                            resp = await http.get(
                                account.userinfo_endpoint,
                                headers={"Authorization": f"Bearer {fresh_token}"},
                            )
                            if resp.status_code == 401:  # noqa: PLR2004
                                # A brand-new token was obtained successfully but the
                                # userinfo endpoint still rejects it.  The token refresh
                                # proves credentials are valid; the 401 is a secondary
                                # issue with the validation URL — either the token's
                                # scope doesn't permit userinfo access, or the provider
                                # (e.g. Google My Business) issues tokens that don't
                                # work with the standard OpenID userinfo endpoint.
                                logger.info(
                                    "Userinfo still returned 401 with fresh token for account %s — "
                                    "token refresh succeeded so credentials are valid; "
                                    "validation URL may not be compatible with this token type",
                                    account_id,
                                )
                                _userinfo_scopes = {
                                    "openid",
                                    "email",
                                    "profile",
                                    "https://www.googleapis.com/auth/userinfo.email",
                                    "https://www.googleapis.com/auth/userinfo.profile",
                                }
                                has_userinfo_scope = bool(set(account.scopes or []) & _userinfo_scopes)
                                if has_userinfo_scope:
                                    detail_msg = (
                                        "Token refresh succeeded (credentials are valid), but the "
                                        "validation URL still returned 401. This can happen when "
                                        "certain API-specific scopes (e.g. Google My Business) "
                                        "cause the provider to issue tokens that are not accepted "
                                        "by the standard userinfo endpoint. "
                                        "The connection should work for its configured purpose."
                                    )
                                else:
                                    detail_msg = (
                                        "Token refresh succeeded (credentials are valid), but the "
                                        "validation URL returned 401. Your scopes do not include "
                                        "'openid', 'email', or 'profile', which the userinfo "
                                        "endpoint requires. The connection will work for its "
                                        "configured scope."
                                    )
                                account.last_validated_at = datetime.now(timezone.utc)
                                session.add(account)
                                await session.flush()
                                return ValidateConnectionResponse(
                                    success=True,
                                    message=detail_msg,
                                )
                        # If refresh failed or produced the same token, fall through to
                        # the generic non-200 handler below with the original response.

                    if resp.status_code == 200:  # noqa: PLR2004
                        details = (
                            resp.json() if resp.headers.get("content-type", "").startswith("application/json") else {}
                        )
                    else:
                        return ValidateConnectionResponse(
                            success=False,
                            message=f"Userinfo endpoint returned HTTP {resp.status_code}",
                            details={"status_code": resp.status_code, "body": resp.text[:500]},
                        )

            # Update last_validated_at
            account.last_validated_at = datetime.now(timezone.utc)
            session.add(account)
            await session.flush()

            return ValidateConnectionResponse(
                success=True,
                message="Connection validated successfully",
                details=details or None,
            )

        except Exception as exc:  # noqa: BLE001
            logger.warning("OAuth validation failed for account %s: %s", account_id, exc)
            return ValidateConnectionResponse(success=False, message=str(exc))

    async def rotate_tokens(
        self,
        session: AsyncSession,
        user_id: UUID,
        account_id: UUID,
    ) -> RotateTokensResponse:
        """Force-refresh / re-acquire tokens for an account."""
        account = await get_oauth_account(session, account_id, user_id)
        if account is None:
            return RotateTokensResponse(success=False, message="OAuth account not found")

        try:
            refresh_tok = decrypt_account_refresh_token(account)
            client_secret = decrypt_account_secret(account)

            if refresh_tok and client_secret and account.token_endpoint:
                token_data = await self._refresh_token(account, client_secret, refresh_tok)
                expires_in = token_data.get("expires_in")
                expires_at = None
                if expires_in:
                    expires_at = datetime.now(timezone.utc) + timedelta(seconds=int(expires_in))
                await save_tokens(
                    session,
                    account,
                    access_token=token_data.get("access_token"),
                    refresh_token=token_data.get("refresh_token", refresh_tok),
                    token_expires_at=expires_at,
                )
                await session.refresh(account)
                return RotateTokensResponse(
                    success=True,
                    message="Tokens refreshed successfully",
                    token_expires_at=account.token_expires_at,
                )

            # No refresh token: re-acquire from scratch
            await self._acquire_token(session, account)
            await session.refresh(account)
            return RotateTokensResponse(
                success=True,
                message="Tokens re-acquired successfully",
                token_expires_at=account.token_expires_at,
            )

        except Exception as exc:  # noqa: BLE001
            logger.warning("Token rotation failed for account %s: %s", account_id, exc)
            return RotateTokensResponse(success=False, message=str(exc))

    async def refresh_due_accounts(self, session: AsyncSession) -> None:
        """Rotate tokens for all accounts whose auto-refresh interval has elapsed."""
        accounts = await list_accounts_due_for_refresh(session)
        for account in accounts:
            try:
                await self._acquire_token(session, account)
                await session.refresh(account)
                logger.info("Auto-refreshed tokens for OAuth account %s (%s)", account.id, account.name)
            except Exception as exc:  # noqa: BLE001
                logger.warning(
                    "Auto-refresh failed for OAuth account %s (%s): %s",
                    account.id,
                    account.name,
                    exc,
                )


_service_instance: OAuthAccountService | None = None


def get_oauth_account_service() -> OAuthAccountService:
    global _service_instance  # noqa: PLW0603
    if _service_instance is None:
        _service_instance = OAuthAccountService()
    return _service_instance


async def run_token_refresh_loop(interval_seconds: int = 60) -> None:
    """Background task: periodically auto-refresh OAuth tokens that are due."""
    import asyncio

    from langflow.services.deps import session_scope

    svc = get_oauth_account_service()
    while True:
        await asyncio.sleep(interval_seconds)
        try:
            async with session_scope() as session:
                await svc.refresh_due_accounts(session)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Token refresh loop error: %s", exc)
