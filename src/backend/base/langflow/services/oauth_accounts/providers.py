"""Built-in OAuth provider registry.

Each entry describes the default endpoints and UI metadata for a well-known
OAuth2 provider so the user does not have to fill in boilerplate URLs.
Custom providers are also supported - they just need explicit endpoints.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass
class ProviderDef:
    id: str
    display_name: str
    icon: str  # Lucide icon name or custom icon key
    default_auth_endpoint: str | None = None
    default_token_endpoint: str | None = None
    default_userinfo_endpoint: str | None = None
    default_scopes: list[str] = field(default_factory=list)
    supported_flows: list[str] = field(default_factory=lambda: ["client_credentials"])
    docs_url: str | None = None
    # Extra hint fields shown in the UI
    hints: dict[str, str] = field(default_factory=dict)


PROVIDERS: dict[str, ProviderDef] = {
    "google": ProviderDef(
        id="google",
        display_name="Google Cloud",
        icon="Chrome",
        default_auth_endpoint="https://accounts.google.com/o/oauth2/v2/auth",
        default_token_endpoint="https://oauth2.googleapis.com/token",  # noqa: S106  # pragma: allowlist secret
        default_userinfo_endpoint="https://www.googleapis.com/oauth2/v3/userinfo",
        default_scopes=["openid", "email", "profile"],
        supported_flows=["service_account", "authorization_code"],
        docs_url="https://developers.google.com/identity/protocols/oauth2",
        hints={
            "service_account": (
                "Paste the contents of your Google Service Account JSON key file "
                "into the 'Extra Data' field. Or upload the JSON key file directly."
            ),
            "authorization_code": (
                "Upload your Google OAuth2 client_secret JSON file, or enter the client ID "
                "and secret manually. Click 'Connect with Google' after saving to complete "
                "the authorization."
            ),
        },
    ),
    "github": ProviderDef(
        id="github",
        display_name="GitHub",
        icon="Github",
        default_token_endpoint="https://github.com/login/oauth/access_token",  # noqa: S106  # pragma: allowlist secret
        default_userinfo_endpoint="https://api.github.com/user",
        default_scopes=["repo", "read:org"],
        supported_flows=["authorization_code", "api_key"],
        docs_url="https://docs.github.com/en/apps/oauth-apps",
        hints={
            "api_key": (  # pragma: allowlist secret
                "Use a GitHub Personal Access Token (classic or fine-grained) as the client secret."
            ),
        },
    ),
    "microsoft": ProviderDef(
        id="microsoft",
        display_name="Microsoft / Azure",
        icon="Monitor",
        default_token_endpoint=(  # noqa: S106  # pragma: allowlist secret
            "https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token"
        ),
        default_userinfo_endpoint="https://graph.microsoft.com/v1.0/me",
        default_scopes=["https://graph.microsoft.com/.default"],
        supported_flows=["client_credentials", "authorization_code"],
        docs_url="https://learn.microsoft.com/en-us/azure/active-directory/develop/v2-oauth2-client-creds-grant-flow",
        hints={
            "token_endpoint": "Replace {tenant_id} with your Azure tenant ID (or 'common' for multi-tenant).",
        },
    ),
    "slack": ProviderDef(
        id="slack",
        display_name="Slack",
        icon="MessageSquare",
        default_token_endpoint="https://slack.com/api/oauth.v2.access",  # noqa: S106  # pragma: allowlist secret
        default_userinfo_endpoint="https://slack.com/api/auth.test",
        default_scopes=["channels:read", "chat:write"],
        supported_flows=["authorization_code", "api_key"],
        docs_url="https://api.slack.com/authentication/oauth-v2",
        hints={
            "api_key": "Use a Slack Bot Token (xoxb-…) as the client secret.",  # pragma: allowlist secret
        },
    ),
    "hubspot": ProviderDef(
        id="hubspot",
        display_name="HubSpot",
        icon="Database",
        default_token_endpoint="https://api.hubapi.com/oauth/v1/token",  # noqa: S106  # pragma: allowlist secret
        default_userinfo_endpoint="https://api.hubapi.com/integrations/v1/me",
        default_scopes=["contacts", "crm.objects.contacts.read"],
        supported_flows=["authorization_code"],
        docs_url="https://developers.hubspot.com/docs/api/oauth-quickstart-guide",
    ),
    "salesforce": ProviderDef(
        id="salesforce",
        display_name="Salesforce",
        icon="Cloud",
        default_token_endpoint=(  # noqa: S106  # pragma: allowlist secret
            "https://login.salesforce.com/services/oauth2/token"
        ),
        default_userinfo_endpoint="https://login.salesforce.com/services/oauth2/userinfo",
        default_scopes=["api", "refresh_token"],
        supported_flows=["client_credentials", "authorization_code"],
        docs_url="https://help.salesforce.com/s/articleView?id=sf.remoteaccess_oauth_web_server_flow.htm",
    ),
    "custom": ProviderDef(
        id="custom",
        display_name="Custom Provider",
        icon="Settings",
        supported_flows=["client_credentials", "authorization_code", "api_key", "service_account"],
        hints={
            "token_endpoint": "Required for client_credentials and authorization_code flows.",
        },
    ),
}


def get_provider(provider_id: str) -> ProviderDef | None:
    return PROVIDERS.get(provider_id)


def list_providers() -> list[dict]:
    return [
        {
            "id": p.id,
            "display_name": p.display_name,
            "icon": p.icon,
            "default_auth_endpoint": p.default_auth_endpoint,
            "default_token_endpoint": p.default_token_endpoint,
            "default_userinfo_endpoint": p.default_userinfo_endpoint,
            "default_scopes": p.default_scopes,
            "supported_flows": p.supported_flows,
            "docs_url": p.docs_url,
            "hints": p.hints,
        }
        for p in PROVIDERS.values()
    ]
