"""add oauth_account table

Phase: EXPAND

Revision ID: a1b2c3d4e5f7
Revises: mb01b2c3d4e5
Create Date: 2026-05-12 18:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from langflow.utils import migration

revision: str = "a1b2c3d4e5f7"  # pragma: allowlist secret
down_revision: str | None = "mb01b2c3d4e5"  # pragma: allowlist secret
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLE_NAME = "oauth_account"


def upgrade() -> None:
    conn = op.get_bind()

    # Guard: SQLModel.create_all() may have already created the table on a
    # fresh database before Alembic runs. Skip DDL in that case; the schema
    # is already correct from the model definition.
    if migration.table_exists(TABLE_NAME, conn):
        return

    op.create_table(
        TABLE_NAME,
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("provider", sa.String(), nullable=False),
        sa.Column("flow_type", sa.String(), nullable=False, server_default="client_credentials"),
        sa.Column("client_id", sa.Text(), nullable=True),
        sa.Column("client_secret_enc", sa.Text(), nullable=True),
        sa.Column("access_token_enc", sa.Text(), nullable=True),
        sa.Column("refresh_token_enc", sa.Text(), nullable=True),
        sa.Column("extra_data_enc", sa.Text(), nullable=True),
        sa.Column("scopes", sa.JSON(), nullable=False, server_default="[]"),
        sa.Column("token_endpoint", sa.Text(), nullable=True),
        sa.Column("userinfo_endpoint", sa.Text(), nullable=True),
        sa.Column("token_expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column("last_used_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("last_validated_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["user.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("id"),
    )
    op.create_index("ix_oauth_account_user_id", TABLE_NAME, ["user_id"])
    op.create_index("ix_oauth_account_provider", TABLE_NAME, ["provider"])
    op.create_index("ix_oauth_account_name", TABLE_NAME, ["name"])


def downgrade() -> None:
    conn = op.get_bind()
    if not migration.table_exists(TABLE_NAME, conn):
        return
    op.drop_index("ix_oauth_account_name", table_name=TABLE_NAME)
    op.drop_index("ix_oauth_account_provider", table_name=TABLE_NAME)
    op.drop_index("ix_oauth_account_user_id", table_name=TABLE_NAME)
    op.drop_table(TABLE_NAME)
