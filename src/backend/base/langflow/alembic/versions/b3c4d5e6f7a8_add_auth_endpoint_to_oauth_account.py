"""add auth_endpoint to oauth_account

Phase: EXPAND

Revision ID: b3c4d5e6f7a8
Revises: a1b2c3d4e5f7
Create Date: 2026-05-13 00:00:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from langflow.utils import migration

revision: str = "b3c4d5e6f7a8"  # pragma: allowlist secret
down_revision: str | None = "a1b2c3d4e5f7"  # pragma: allowlist secret
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TABLE_NAME = "oauth_account"
COLUMN_NAME = "auth_endpoint"


def upgrade() -> None:
    conn = op.get_bind()
    if not migration.table_exists(TABLE_NAME, conn):
        return
    if not migration.column_exists(TABLE_NAME, COLUMN_NAME, conn):
        op.add_column(TABLE_NAME, sa.Column(COLUMN_NAME, sa.Text(), nullable=True))


def downgrade() -> None:
    conn = op.get_bind()
    if not migration.table_exists(TABLE_NAME, conn):
        return
    if not migration.column_exists(TABLE_NAME, COLUMN_NAME, conn):
        return
    op.drop_column(TABLE_NAME, COLUMN_NAME)
