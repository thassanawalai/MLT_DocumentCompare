"""Add company registration and reference fields to customers."""
from alembic import op
import sqlalchemy as sa


revision = "20261031_0004"
down_revision = "20261022_0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("customers", sa.Column("acid_no", sa.String(), nullable=True))
    op.add_column("customers", sa.Column("importer_no", sa.String(), nullable=True))
    op.add_column("customers", sa.Column("exporter_no", sa.String(), nullable=True))
    op.add_column("customers", sa.Column("uasc_no", sa.String(), nullable=True))
    op.add_column("customers", sa.Column("remark", sa.Text(), nullable=True))


def downgrade() -> None:
    op.drop_column("customers", "remark")
    op.drop_column("customers", "uasc_no")
    op.drop_column("customers", "exporter_no")
    op.drop_column("customers", "importer_no")
    op.drop_column("customers", "acid_no")
