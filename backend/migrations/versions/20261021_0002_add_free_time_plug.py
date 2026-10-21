"""Keep the FREE TIME PLUG value from the source workbook."""
from alembic import op
import sqlalchemy as sa


revision = "20261021_0002"
down_revision = "20261021_0001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "freetime_records",
        sa.Column("free_time_plug", sa.Text(), nullable=False, server_default=""),
    )


def downgrade() -> None:
    op.drop_column("freetime_records", "free_time_plug")
