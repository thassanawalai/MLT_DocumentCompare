"""Create customer master data tables."""
from alembic import op
import sqlalchemy as sa


revision = "20261022_0003"
down_revision = "20261021_0002"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "customers",
        sa.Column("customer_id", sa.Integer(), primary_key=True),
        sa.Column("customer_name", sa.String(), nullable=False),
        sa.Column("customer_type", sa.String()),
        sa.Column("raw_address", sa.Text()),
        sa.Column("address_line1", sa.String()),
        sa.Column("address_line2", sa.String()),
        sa.Column("city", sa.String()),
        sa.Column("state", sa.String()),
        sa.Column("postal_code", sa.String()),
        sa.Column("country", sa.String()),
        sa.Column("status", sa.String(), server_default="Active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_customers_customer_id", "customers", ["customer_id"])
    op.create_index("ix_customers_customer_name", "customers", ["customer_name"])

    op.create_table(
        "customer_addresses",
        sa.Column("address_id", sa.Integer(), primary_key=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.customer_id", ondelete="CASCADE")),
        sa.Column("address_type", sa.String()), sa.Column("raw_address", sa.Text()),
        sa.Column("address_line1", sa.String()), sa.Column("address_line2", sa.String()),
        sa.Column("city", sa.String()), sa.Column("state", sa.String()),
        sa.Column("postal_code", sa.String()), sa.Column("country", sa.String()),
        sa.Column("is_primary", sa.Boolean(), server_default=sa.false()),
    )
    op.create_index("ix_customer_addresses_address_id", "customer_addresses", ["address_id"])

    op.create_table(
        "customer_contacts",
        sa.Column("contact_id", sa.Integer(), primary_key=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.customer_id", ondelete="CASCADE")),
        sa.Column("contact_name", sa.String()), sa.Column("job_title", sa.String()),
        sa.Column("contact_type", sa.String()), sa.Column("email", sa.String()),
        sa.Column("phone", sa.String()), sa.Column("fax", sa.String()),
        sa.Column("is_primary", sa.Boolean(), server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_customer_contacts_contact_id", "customer_contacts", ["contact_id"])
    op.create_index("ix_customer_contacts_email", "customer_contacts", ["email"])
    op.create_index("ix_customer_contacts_phone", "customer_contacts", ["phone"])

    op.create_table(
        "customer_banks",
        sa.Column("bank_id", sa.Integer(), primary_key=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.customer_id", ondelete="CASCADE")),
        sa.Column("bank_name", sa.String()), sa.Column("branch_name", sa.String()),
        sa.Column("bank_address", sa.String()), sa.Column("bank_country", sa.String()),
        sa.Column("swift_bic_code", sa.String()), sa.Column("account_no", sa.String()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_customer_banks_bank_id", "customer_banks", ["bank_id"])

    op.create_table(
        "customer_identifiers",
        sa.Column("identifier_id", sa.Integer(), primary_key=True),
        sa.Column("customer_id", sa.Integer(), sa.ForeignKey("customers.customer_id", ondelete="CASCADE")),
        sa.Column("identifier_type", sa.String()), sa.Column("identifier_value", sa.String()),
        sa.Column("issuing_country", sa.String()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True)),
    )
    op.create_index("ix_customer_identifiers_identifier_id", "customer_identifiers", ["identifier_id"])
    op.create_index("ix_customer_identifiers_identifier_type", "customer_identifiers", ["identifier_type"])
    op.create_index("ix_customer_identifiers_identifier_value", "customer_identifiers", ["identifier_value"])


def downgrade() -> None:
    op.drop_table("customer_identifiers")
    op.drop_table("customer_banks")
    op.drop_table("customer_contacts")
    op.drop_table("customer_addresses")
    op.drop_table("customers")
