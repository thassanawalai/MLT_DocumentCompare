"""Create HS Code and Freetime tables."""
from alembic import op
import sqlalchemy as sa


revision = "20261021_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "hs_code_records",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("sale", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("customer", sa.String(length=500), nullable=False, server_default=""),
        sa.Column("commodity", sa.Text(), nullable=False, server_default=""),
        sa.Column("hs_code", sa.String(length=100), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_hs_code_records_hs_code", "hs_code_records", ["hs_code"])
    op.create_index("ix_hs_code_records_customer", "hs_code_records", ["customer"])

    op.create_table(
        "freetime_records",
        sa.Column("id", sa.BigInteger(), autoincrement=True, nullable=False),
        sa.Column("carrier", sa.String(length=255), nullable=False, server_default=""),
        sa.Column("lat_krabang", sa.Text(), nullable=False, server_default=""),
        sa.Column("laem_chabang", sa.Text(), nullable=False, server_default=""),
        sa.Column("pat_bangkok", sa.Text(), nullable=False, server_default=""),
        sa.Column("songkla", sa.Text(), nullable=False, server_default=""),
        sa.Column("reefer", sa.Text(), nullable=False, server_default=""),
        sa.Column("remark", sa.Text(), nullable=False, server_default=""),
        sa.Column("dem_20_40", sa.Text(), nullable=False, server_default=""),
        sa.Column("dt_20_40", sa.Text(), nullable=False, server_default=""),
        sa.Column("dem_reefer", sa.Text(), nullable=False, server_default=""),
        sa.Column("det_reefer", sa.Text(), nullable=False, server_default=""),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_freetime_records_carrier", "freetime_records", ["carrier"])


def downgrade() -> None:
    op.drop_index("ix_freetime_records_carrier", table_name="freetime_records")
    op.drop_table("freetime_records")
    op.drop_index("ix_hs_code_records_customer", table_name="hs_code_records")
    op.drop_index("ix_hs_code_records_hs_code", table_name="hs_code_records")
    op.drop_table("hs_code_records")
