from datetime import datetime, timezone
from typing import TYPE_CHECKING
from uuid import UUID, uuid4

from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

if TYPE_CHECKING:
    from langflow.services.database.models.flow import Flow
    from langflow.services.database.models.user import User


class FlowShared(SQLModel, table=True):  # type: ignore[call-arg]
    __tablename__ = "flow_shared"
    id: UUID = Field(default_factory=uuid4, primary_key=True, unique=True)
    flow_id: UUID = Field(foreign_key="flow.id", index=True, nullable=False)
    user_id: UUID = Field(foreign_key="user.id", index=True, nullable=False)
    is_active: bool = Field(default=False)
    access_edit: bool = Field(default=False)
    access_view: bool = Field(default=False)
    access_chat: bool = Field(default=False)

    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    flow: "Flow" = Relationship(back_populates="shared_flows")
    user: "User" = Relationship(back_populates="shared_flows")

    __table_args__ = (UniqueConstraint("user_id", "flow_id", name="uq_flow_shared_per_user"),)


class FlowSharedCreate(SQLModel):
    flow_id: UUID = Field()
    user_id: UUID = Field()
    is_active: bool = Field(default=False)
    access_view: bool = Field(default=False)
    access_edit: bool = Field(default=False)
    access_run: bool = Field(default=False)


class FlowSharedRead(SQLModel):
    id: UUID = Field()
    flow_id: UUID = Field()
    user_id: UUID = Field()
    is_active: bool = Field()
    access_view: bool = Field()
    access_edit: bool = Field()
    access_run: bool = Field()
    created_at: datetime = Field()
    updated_at: datetime = Field()


class FlowSharedUpdate(SQLModel):
    is_active: bool | None = None
    access_view: bool | None = None
    access_edit: bool | None = None
    access_run: bool | None = None
