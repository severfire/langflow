"""add auto_refresh_interval_minutes to oauth_account

Phase: EXPAND

Revision ID: c4d5e6f7a8b9
Revises: b3c4d5e6f7a8
Create Date: 2026-05-13 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from langflow.utils import migration

revision: str = "c4d5e6f7a8b9"  # pragma: allowlist secret
down_revision: str | None = "b3c4d5e6f7a8"  # pragma: allowlist secret
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLE_NAME = "oauth_account"
COLUMN_NAME = "auto_refresh_interval_minutes"


def upgrade() -> None:
    conn = op.get_bind()
    if not migration.table_exists(TABLE_NAME, conn):
        return
    if not migration.column_exists(TABLE_NAME, COLUMN_NAME, conn):
        op.add_column(TABLE_NAME, sa.Column(COLUMN_NAME, sa.Integer(), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    if not migration.table_exists(TABLE_NAME, conn):
        return
    if not migration.column_exists(TABLE_NAME, COLUMN_NAME, conn):
        return
    op.drop_column(TABLE_NAME, COLUMN_NAME)
