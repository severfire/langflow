from __future__ import annotations

from typing import TYPE_CHECKING

from sqlmodel import select

from langflow.services.auth import utils as auth_utils
from langflow.services.database.models.oauth_provider.model import (
    OAuthAccount,
    OAuthProviderCreate,
    OAuthProviderRead,
    OAuthProviderUpdate,
)

if TYPE_CHECKING:
    from uuid import UUID

    from sqlmodel.ext.asyncio.session import AsyncSession


def _encrypt(value: str | None) -> str | None:
    if value is None:
        return None
    return auth_utils.encrypt_api_key(value)


def _decrypt(value: str | None) -> str | None:
    if value is None:
        return None
    try:
        result = auth_utils.decrypt_api_key(value)
    except Exception:  # noqa: BLE001
        return None
    else:
        return result or None


async def list_oauth_providers(session: AsyncSession, user_id: UUID) -> list[OAuthProviderRead]:
    query = select(OAuthAccount).where(OAuthAccount.user_id == user_id, OAuthAccount.is_active.is_(True))
    accounts = (await session.exec(query)).all()
    return [OAuthProviderRead.from_orm(a) for a in accounts]


async def get_oauth_provider(session: AsyncSession, account_id: UUID, user_id: UUID) -> OAuthAccount | None:
    account = await session.get(OAuthAccount, account_id)
    if account is None or account.user_id != user_id:
        return None
    return account


async def create_oauth_provider(
    session: AsyncSession,
    payload: OAuthProviderCreate,
    user_id: UUID,
) -> OAuthProviderRead:
    account = OAuthAccount(
        user_id=user_id,
        name=payload.name,
        provider=payload.provider,
        flow_type=payload.flow_type,
        client_id=payload.client_id,
        client_secret_enc=_encrypt(payload.client_secret),
        scopes=payload.scopes or [],
        auth_endpoint=payload.auth_endpoint,
        token_endpoint=payload.token_endpoint,
        userinfo_endpoint=payload.userinfo_endpoint,
        extra_data_enc=_encrypt(payload.extra_data),
    )
    session.add(account)
    await session.flush()
    await session.refresh(account)
    return OAuthProviderRead.from_orm(account)


async def update_oauth_provider(
    session: AsyncSession,
    account_id: UUID,
    user_id: UUID,
    payload: OAuthProviderUpdate,
) -> OAuthProviderRead | None:
    account = await get_oauth_provider(session, account_id, user_id)
    if account is None:
        return None

    if payload.name is not None:
        account.name = payload.name
    if payload.client_id is not None:
        account.client_id = payload.client_id
    if payload.client_secret is not None:
        account.client_secret_enc = _encrypt(payload.client_secret)
    if payload.scopes is not None:
        account.scopes = payload.scopes
    if payload.auth_endpoint is not None:
        account.auth_endpoint = payload.auth_endpoint
    if payload.token_endpoint is not None:
        account.token_endpoint = payload.token_endpoint
    if payload.userinfo_endpoint is not None:
        account.userinfo_endpoint = payload.userinfo_endpoint
    if payload.extra_data is not None:
        account.extra_data_enc = _encrypt(payload.extra_data)
    if payload.is_active is not None:
        account.is_active = payload.is_active
    if payload.auto_refresh_interval_minutes is not None:
        account.auto_refresh_interval_minutes = payload.auto_refresh_interval_minutes

    session.add(account)
    await session.flush()
    await session.refresh(account)
    return OAuthProviderRead.from_orm(account)


async def delete_oauth_provider(session: AsyncSession, account_id: UUID, user_id: UUID) -> None:
    account = await get_oauth_provider(session, account_id, user_id)
    if account is None:
        msg = "OAuth provider not found"
        raise ValueError(msg)
    await session.delete(account)


async def save_tokens(
    session: AsyncSession,
    account: OAuthAccount,
    *,
    access_token: str | None = None,
    refresh_token: str | None = None,
    token_expires_at=None,
) -> None:
    from datetime import datetime, timezone

    if access_token is not None:
        account.access_token_enc = _encrypt(access_token)
    if refresh_token is not None:
        account.refresh_token_enc = _encrypt(refresh_token)
    if token_expires_at is not None:
        account.token_expires_at = token_expires_at
    account.last_used_at = datetime.now(timezone.utc)
    session.add(account)
    await session.flush()


def decrypt_account_secret(account: OAuthAccount) -> str | None:
    return _decrypt(account.client_secret_enc)


def decrypt_account_access_token(account: OAuthAccount) -> str | None:
    return _decrypt(account.access_token_enc)


def decrypt_account_refresh_token(account: OAuthAccount) -> str | None:
    return _decrypt(account.refresh_token_enc)


def decrypt_extra_data(account: OAuthAccount) -> str | None:
    return _decrypt(account.extra_data_enc)


async def list_providers_due_for_refresh(session: AsyncSession) -> list[OAuthAccount]:
    """Return all active providers whose auto-refresh interval has elapsed."""
    from datetime import datetime, timedelta, timezone

    now = datetime.now(timezone.utc)
    query = select(OAuthAccount).where(
        OAuthAccount.is_active.is_(True),
        OAuthAccount.auto_refresh_interval_minutes.is_not(None),
    )
    accounts = (await session.exec(query)).all()
    due = []
    for account in accounts:
        if account.auto_refresh_interval_minutes is None:
            continue
        interval = timedelta(minutes=account.auto_refresh_interval_minutes)
        baseline = account.last_used_at
        if baseline is None:
            due.append(account)
            continue
        from langflow.services.database.models.oauth_provider.model import _ensure_utc

        if _ensure_utc(baseline) + interval <= now:
            due.append(account)
    return due
