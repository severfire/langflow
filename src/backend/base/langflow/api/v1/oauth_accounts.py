"""OAuth Account management endpoints.

Endpoints:
  GET    /api/v1/oauth_accounts/                   - list accounts
  POST   /api/v1/oauth_accounts/                   - create account
  GET    /api/v1/oauth_accounts/providers          - list supported providers
  GET    /api/v1/oauth_accounts/callback           - OAuth2 authorization code callback (browser redirect)
  GET    /api/v1/oauth_accounts/{id}               - get single account
  PATCH  /api/v1/oauth_accounts/{id}               - update account
  DELETE /api/v1/oauth_accounts/{id}               - delete account
  GET    /api/v1/oauth_accounts/{id}/authorize     - start authorization_code flow
  POST   /api/v1/oauth_accounts/{id}/validate      - test connection
  POST   /api/v1/oauth_accounts/{id}/rotate        - force token refresh
"""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import HTMLResponse

from langflow.api.utils import CurrentActiveUser, DbSession
from langflow.services.database.models.oauth_account.model import (
    OAuthAccountCreate,
    OAuthAccountRead,
    OAuthAccountsListResponse,
    OAuthAccountUpdate,
    RotateTokensResponse,
    ValidateConnectionResponse,
)
from langflow.services.oauth_accounts.providers import list_providers
from langflow.services.oauth_accounts.service import get_oauth_account_service

router = APIRouter(tags=["OAuthAccounts"], prefix="/oauth_accounts")

# ---------------------------------------------------------------------------
# HTML templates for the popup callback page
# ---------------------------------------------------------------------------

_CALLBACK_SHARED_STYLES = """
  *, *::before, *::after {{ box-sizing: border-box; }}
  :root {{
    --bg: #f8fafc;
    --card-bg: #ffffff;
    --card-border: #e2e8f0;
    --text-primary: #0f172a;
    --text-secondary: #64748b;
    --shadow: 0 4px 24px rgba(0, 0, 0, .08);
    --success-icon-bg: #dcfce7;
    --success-icon-color: #16a34a;
    --error-icon-bg: #fee2e2;
    --error-icon-color: #dc2626;
    --hint-color: #94a3b8;
    --font: "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif;
  }}
  @media (prefers-color-scheme: dark) {{
    :root {{
      --bg: #09090b;
      --card-bg: #18181b;
      --card-border: #27272a;
      --text-primary: #fafafa;
      --text-secondary: #a1a1aa;
      --shadow: 0 4px 32px rgba(0, 0, 0, .4);
      --success-icon-bg: #14532d;
      --success-icon-color: #4ade80;
      --error-icon-bg: #450a0a;
      --error-icon-color: #f87171;
      --hint-color: #52525b;
    }}
  }}
  body {{
    font-family: var(--font);
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    margin: 0;
    background: var(--bg);
    color: var(--text-primary);
    -webkit-font-smoothing: antialiased;
  }}
  .card {{
    text-align: center;
    padding: 2.5rem 2rem;
    border-radius: 0.75rem;
    background: var(--card-bg);
    border: 1px solid var(--card-border);
    box-shadow: var(--shadow);
    max-width: 360px;
    width: calc(100% - 2rem);
  }}
  .icon-wrap {{
    width: 3.5rem;
    height: 3.5rem;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1.25rem;
  }}
  .icon-wrap svg {{
    width: 1.75rem;
    height: 1.75rem;
    flex-shrink: 0;
  }}
  .icon-wrap.success {{ background: var(--success-icon-bg); color: var(--success-icon-color); }}
  .icon-wrap.error {{ background: var(--error-icon-bg); color: var(--error-icon-color); }}
  h1 {{
    font-size: 1.125rem;
    font-weight: 600;
    letter-spacing: -0.01em;
    margin: 0 0 0.5rem;
    line-height: 1.4;
  }}
  .subtitle {{
    color: var(--text-secondary);
    font-size: 0.875rem;
    margin: 0 0 1.25rem;
    line-height: 1.5;
  }}
  .hint {{
    font-size: 0.75rem;
    color: var(--hint-color);
    margin: 0;
  }}
  .countdown {{
    display: inline-block;
    font-variant-numeric: tabular-nums;
  }}
"""

_CALLBACK_SUCCESS_HTML = (
    """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Account connected</title>
  <style>"""
    + _CALLBACK_SHARED_STYLES
    + """</style>
</head>
<body>
<div class="card">
  <div class="icon-wrap success">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  </div>
  <h1>Account connected</h1>
  <p class="subtitle">Your account has been authorized successfully.</p>
  <p class="hint">This window will close in <span class="countdown" id="cd">3</span>s&hellip;</p>
</div>
<script>
  (function () {{
    try {{
      if (window.opener) {{
        window.opener.postMessage({{ type: 'oauth_callback', success: true }}, '*');
      }}
    }} catch (e) {{}}
    var el = document.getElementById('cd');
    var n = 3;
    var t = setInterval(function () {{
      n -= 1;
      if (el) el.textContent = n;
      if (n <= 0) {{ clearInterval(t); window.close(); }}
    }}, 1000);
    setTimeout(function () {{ window.close(); }}, 3000);
  }})();
</script>
</body>
</html>"""
)

_CALLBACK_ERROR_HTML = (
    """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Authorization failed</title>
  <style>"""
    + _CALLBACK_SHARED_STYLES
    + """
  h1 {{ color: var(--error-icon-color); }}
  </style>
</head>
<body>
<div class="card">
  <div class="icon-wrap error">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"
         stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  </div>
  <h1>Authorization failed</h1>
  <p class="subtitle">{error}</p>
  <p class="hint">This window will close in <span class="countdown" id="cd">5</span>s&hellip;</p>
</div>
<script>
  (function () {{
    try {{
      if (window.opener) {{
        window.opener.postMessage({{ type: 'oauth_callback', success: false, error: {error_json} }}, '*');
      }}
    }} catch (e) {{}}
    var el = document.getElementById('cd');
    var n = 5;
    var t = setInterval(function () {{
      n -= 1;
      if (el) el.textContent = n;
      if (n <= 0) {{ clearInterval(t); window.close(); }}
    }}, 1000);
    setTimeout(function () {{ window.close(); }}, 5000);
  }})();
</script>
</body>
</html>"""
)


@router.get("/providers", include_in_schema=True)
async def get_providers() -> list[dict]:
    """Return all built-in OAuth provider definitions."""
    return list_providers()


@router.get("/", include_in_schema=True)
async def list_oauth_accounts_route(
    db: DbSession,
    current_user: CurrentActiveUser,
) -> OAuthAccountsListResponse:
    svc = get_oauth_account_service()
    accounts = await svc.list_accounts(db, current_user.id)
    return OAuthAccountsListResponse(total_count=len(accounts), accounts=accounts)


@router.post("/", status_code=status.HTTP_201_CREATED, include_in_schema=True)
async def create_oauth_account_route(
    payload: OAuthAccountCreate,
    db: DbSession,
    current_user: CurrentActiveUser,
) -> OAuthAccountRead:
    try:
        svc = get_oauth_account_service()
        return await svc.create_account(db, current_user.id, payload)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc


@router.get("/callback", include_in_schema=True)
async def oauth_callback_route(
    request: Request,
    db: DbSession,
    code: Annotated[str | None, Query()] = None,
    state: Annotated[str | None, Query()] = None,
    error: Annotated[str | None, Query()] = None,
    error_description: Annotated[str | None, Query()] = None,
) -> HTMLResponse:
    """Handle the OAuth2 authorization code callback from the provider.

    This endpoint is opened in a popup by the frontend. On success it returns
    an HTML page that posts a message to the opener and closes itself.
    """
    import json as _json

    if error:
        msg = error_description or error
        return HTMLResponse(
            content=_CALLBACK_ERROR_HTML.format(
                error=msg,
                error_json=_json.dumps(msg),
            ),
            status_code=200,
        )

    if not code or not state:
        msg = "Missing code or state parameter"
        return HTMLResponse(
            content=_CALLBACK_ERROR_HTML.format(
                error=msg,
                error_json=_json.dumps(msg),
            ),
            status_code=200,
        )

    redirect_uri = str(request.base_url).rstrip("/") + "/api/v1/oauth_accounts/callback"

    try:
        svc = get_oauth_account_service()
        await svc.complete_authorization_flow(db, code=code, state=state, redirect_uri=redirect_uri)
        return HTMLResponse(content=_CALLBACK_SUCCESS_HTML.format(), status_code=200)
    except Exception as exc:  # noqa: BLE001
        import logging

        logging.getLogger(__name__).warning("OAuth callback error: %s", exc)
        msg = str(exc)
        return HTMLResponse(
            content=_CALLBACK_ERROR_HTML.format(
                error=msg,
                error_json=_json.dumps(msg),
            ),
            status_code=200,
        )


@router.get("/{account_id}", include_in_schema=True)
async def get_oauth_account_route(
    account_id: UUID,
    db: DbSession,
    current_user: CurrentActiveUser,
) -> OAuthAccountRead:
    from langflow.services.database.models.oauth_account.crud import get_oauth_account
    from langflow.services.database.models.oauth_account.model import OAuthAccountRead

    account = await get_oauth_account(db, account_id, current_user.id)
    if account is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OAuth account not found")
    return OAuthAccountRead.from_orm(account)


@router.patch("/{account_id}", include_in_schema=True)
async def update_oauth_account_route(
    account_id: UUID,
    payload: OAuthAccountUpdate,
    db: DbSession,
    current_user: CurrentActiveUser,
) -> OAuthAccountRead:
    svc = get_oauth_account_service()
    result = await svc.update_account(db, current_user.id, account_id, payload)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="OAuth account not found")
    return result


@router.delete("/{account_id}", status_code=status.HTTP_204_NO_CONTENT, include_in_schema=True)
async def delete_oauth_account_route(
    account_id: UUID,
    db: DbSession,
    current_user: CurrentActiveUser,
) -> None:
    try:
        svc = get_oauth_account_service()
        await svc.delete_account(db, current_user.id, account_id)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/{account_id}/validate", include_in_schema=True)
async def validate_oauth_account_route(
    account_id: UUID,
    db: DbSession,
    current_user: CurrentActiveUser,
) -> ValidateConnectionResponse:
    svc = get_oauth_account_service()
    return await svc.validate_connection(db, current_user.id, account_id)


@router.post("/{account_id}/rotate", include_in_schema=True)
async def rotate_oauth_account_tokens_route(
    account_id: UUID,
    db: DbSession,
    current_user: CurrentActiveUser,
) -> RotateTokensResponse:
    svc = get_oauth_account_service()
    return await svc.rotate_tokens(db, current_user.id, account_id)


@router.get("/{account_id}/authorize", include_in_schema=True)
async def authorize_oauth_account_route(
    account_id: UUID,
    request: Request,
    db: DbSession,
    current_user: CurrentActiveUser,
) -> dict:
    """Return an authorization URL to start the OAuth2 authorization_code flow.

    The frontend should open this URL in a popup window.  When the user
    completes the consent screen, Google (or another provider) will redirect
    to ``/api/v1/oauth_accounts/callback`` which exchanges the code for tokens.
    """
    redirect_uri = str(request.base_url).rstrip("/") + "/api/v1/oauth_accounts/callback"
    try:
        svc = get_oauth_account_service()
        return await svc.start_authorization_flow(db, current_user.id, account_id, redirect_uri)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
