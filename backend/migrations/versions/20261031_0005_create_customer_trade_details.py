"""Create repeatable customer trade detail records."""
from alembic import op
import sqlalchemy as sa


revision = "20261031_0005"
down_revision = "20261031_0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "customer_trade_details",
        sa.Column("trade_detail_id", sa.Integer(), primary_key=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.customer_id", ondelete="CASCADE"), nullable=False),
        sa.Column("acid_no", sa.String(), nullable=True),
        sa.Column("importer_no", sa.String(), nullable=True),
        sa.Column("exporter_no", sa.String(), nullable=True),
        sa.Column("uasc_no", sa.String(), nullable=True),
        sa.Column("remark", sa.Text(), nullable=True),
    )
    op.create_index("ix_customer_trade_details_trade_detail_id", "customer_trade_details", ["trade_detail_id"])
    op.create_index("ix_customer_trade_details_customer_id", "customer_trade_details", ["customer_id"])

    # Preserve the existing single-value customer fields in a first related record.
    op.execute(sa.text("""
        INSERT INTO customer_trade_details
            (customer_id, acid_no, importer_no, exporter_no, uasc_no, remark)
        SELECT customer_id, acid_no, importer_no, exporter_no, uasc_no, remark
        FROM customers
        WHERE COALESCE(acid_no, '') <> ''
           OR COALESCE(importer_no, '') <> ''
           OR COALESCE(exporter_no, '') <> ''
           OR COALESCE(uasc_no, '') <> ''
           OR COALESCE(remark, '') <> ''
    """))


def downgrade() -> None:
    op.drop_index("ix_customer_trade_details_customer_id", table_name="customer_trade_details")
    op.drop_index("ix_customer_trade_details_trade_detail_id", table_name="customer_trade_details")
    op.drop_table("customer_trade_details")
