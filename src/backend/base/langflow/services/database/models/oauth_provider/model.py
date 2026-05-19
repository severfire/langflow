from datetime import datetime, timedelta, timezone
from enum import Enum
from typing import TYPE_CHECKING, Any
from uuid import uuid4

from sqlalchemy import JSON, Column, Text
from sqlmodel import Column as SMColumn
from sqlmodel import DateTime, Field, Relationship, SQLModel

from langflow.schema.serialize import UUIDstr

if TYPE_CHECKING:
    from langflow.services.database.models.user.model import User


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


def _ensure_utc(dt: datetime) -> datetime:
    """Return dt with UTC tzinfo, adding it if the datetime is naive (e.g. from SQLite)."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


class OAuthFlowType(str, Enum):
    """OAuth2 grant type / credential style."""

    client_credentials = "client_credentials"
    authorization_code = "authorization_code"
    service_account = "service_account"
    api_key = "api_key"  # pragma: allowlist secret


class OAuthTokenStatus(str, Enum):
    valid = "valid"
    expired = "expired"
    not_connected = "not_connected"
    unknown = "unknown"


# ---------------------------------------------------------------------------
# Database table
# ---------------------------------------------------------------------------


class OAuthAccount(SQLModel, table=True):  # type: ignore[call-arg]
    __tablename__ = "oauth_provider"

    id: UUIDstr = Field(default_factory=uuid4, primary_key=True, unique=True)
    user_id: UUIDstr = Field(index=True, foreign_key="user.id")

    name: str = Field(index=True)
    provider: str = Field(index=True)  # e.g. "google", "github", "microsoft", "custom"
    flow_type: str = Field(default=OAuthFlowType.client_credentials)

    # Encrypted credentials stored as opaque strings
    client_id: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    client_secret_enc: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    access_token_enc: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    refresh_token_enc: str | None = Field(default=None, sa_column=Column(Text, nullable=True))

    # Service-account JSON / extra provider-specific data (encrypted blob)
    extra_data_enc: str | None = Field(default=None, sa_column=Column(Text, nullable=True))

    # Human-readable metadata
    scopes: list[str] = Field(default_factory=list, sa_column=Column(JSON, nullable=False, server_default="[]"))
    auth_endpoint: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    token_endpoint: str | None = Field(default=None, sa_column=Column(Text, nullable=True))
    userinfo_endpoint: str | None = Field(default=None, sa_column=Column(Text, nullable=True))

    token_expires_at: datetime | None = Field(
        default=None,
        sa_column=SMColumn(DateTime(timezone=True), nullable=True),
    )
    is_active: bool = Field(default=True)
    created_at: datetime = Field(
        default_factory=_utc_now,
        sa_column=SMColumn(DateTime(timezone=True), nullable=False),
    )
    last_used_at: datetime | None = Field(
        default=None,
        sa_column=SMColumn(DateTime(timezone=True), nullable=True),
    )
    last_validated_at: datetime | None = Field(
        default=None,
        sa_column=SMColumn(DateTime(timezone=True), nullable=True),
    )

    auto_refresh_interval_minutes: int | None = Field(default=None, nullable=True)

    user: "User" = Relationship(back_populates="oauth_providers")

    @property
    def token_status(self) -> OAuthTokenStatus:
        if self.access_token_enc is None and self.extra_data_enc is None:
            return OAuthTokenStatus.not_connected
        if self.token_expires_at is None:
            return OAuthTokenStatus.unknown
        now = datetime.now(timezone.utc)
        if _ensure_utc(self.token_expires_at) > now:
            return OAuthTokenStatus.valid
        return OAuthTokenStatus.expired


# ---------------------------------------------------------------------------
# Request / response schemas
# ---------------------------------------------------------------------------


class OAuthProviderCreate(SQLModel):
    name: str
    provider: str
    flow_type: str = OAuthFlowType.client_credentials
    client_id: str | None = None
    client_secret: str | None = None
    scopes: list[str] = Field(default_factory=list)
    auth_endpoint: str | None = None
    token_endpoint: str | None = None
    userinfo_endpoint: str | None = None
    # Base64- or JSON-encoded service account credentials
    extra_data: str | None = None


class OAuthProviderUpdate(SQLModel):
    name: str | None = None
    client_id: str | None = None
    client_secret: str | None = None
    scopes: list[str] | None = None
    auth_endpoint: str | None = None
    token_endpoint: str | None = None
    userinfo_endpoint: str | None = None
    extra_data: str | None = None
    is_active: bool | None = None
    auto_refresh_interval_minutes: int | None = None


class OAuthProviderRead(SQLModel):
    id: UUIDstr
    user_id: UUIDstr
    name: str
    provider: str
    flow_type: str
    # Return masked client_id (last 4 chars visible)
    client_id_masked: str | None = None
    scopes: list[str]
    auth_endpoint: str | None
    token_endpoint: str | None
    userinfo_endpoint: str | None
    token_status: str
    token_expires_at: datetime | None
    is_active: bool
    created_at: datetime
    last_used_at: datetime | None
    last_validated_at: datetime | None
    auto_refresh_interval_minutes: int | None = None
    next_refresh_at: datetime | None = None

    @classmethod
    def from_orm(cls, account: OAuthAccount) -> "OAuthProviderRead":
        cid = account.client_id
        _mask_visible_chars = 4
        masked = (
            f"{'*' * (len(cid) - _mask_visible_chars)}{cid[-_mask_visible_chars:]}"
            if cid and len(cid) > _mask_visible_chars
            else cid
        )

        next_refresh_at = None
        if account.auto_refresh_interval_minutes and account.last_used_at:
            next_refresh_at = _ensure_utc(account.last_used_at) + timedelta(
                minutes=account.auto_refresh_interval_minutes
            )

        return cls(
            id=account.id,
            user_id=account.user_id,
            name=account.name,
            provider=account.provider,
            flow_type=account.flow_type,
            client_id_masked=masked,
            scopes=account.scopes or [],
            auth_endpoint=account.auth_endpoint,
            token_endpoint=account.token_endpoint,
            userinfo_endpoint=account.userinfo_endpoint,
            token_status=account.token_status.value,
            token_expires_at=account.token_expires_at,
            is_active=account.is_active,
            created_at=account.created_at,
            last_used_at=account.last_used_at,
            last_validated_at=account.last_validated_at,
            auto_refresh_interval_minutes=account.auto_refresh_interval_minutes,
            next_refresh_at=next_refresh_at,
        )


class OAuthProvidersListResponse(SQLModel):
    total_count: int
    accounts: list[OAuthProviderRead]


class ValidateConnectionResponse(SQLModel):
    success: bool
    message: str
    details: dict[str, Any] | None = None


class RotateTokensResponse(SQLModel):
    success: bool
    message: str
    token_expires_at: datetime | None = None
    synced_global_variables: list[str] = Field(default_factory=list)
