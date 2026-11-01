"""Safely map legacy Alembic IDs to a known schema revision.

Render's production database may retain a revision ID from a previous migration
file set. Only rewrite that ledger value when the live schema matches a complete
revision snapshot; otherwise stop without changing the database.
"""

from sqlalchemy import inspect, text

from app.db import engine


REVISIONS = [
    (
        "20261021_0001",
        {
            "hs_code_records": {
                "id", "sale", "customer", "commodity", "hs_code", "created_at", "updated_at",
            },
            "freetime_records": {
                "id", "carrier", "lat_krabang", "laem_chabang", "pat_bangkok",
                "songkla", "reefer", "remark", "dem_20_40", "dt_20_40",
                "dem_reefer", "det_reefer", "created_at", "updated_at",
            },
        },
    ),
    (
        "20261021_0002",
        {
            "hs_code_records": {
                "id", "sale", "customer", "commodity", "hs_code", "created_at", "updated_at",
            },
            "freetime_records": {
                "id", "carrier", "lat_krabang", "laem_chabang", "pat_bangkok",
                "songkla", "reefer", "remark", "dem_20_40", "dt_20_40",
                "dem_reefer", "det_reefer", "free_time_plug", "created_at", "updated_at",
            },
        },
    ),
    (
        "20261022_0003",
        {
            "hs_code_records": {
                "id", "sale", "customer", "commodity", "hs_code", "created_at", "updated_at",
            },
            "freetime_records": {
                "id", "carrier", "lat_krabang", "laem_chabang", "pat_bangkok",
                "songkla", "reefer", "remark", "dem_20_40", "dt_20_40",
                "dem_reefer", "det_reefer", "free_time_plug", "created_at", "updated_at",
            },
            "customers": {
                "customer_id", "customer_name", "customer_type", "raw_address",
                "address_line1", "address_line2", "city", "state", "postal_code",
                "country", "status", "created_at", "updated_at",
            },
            "customer_addresses": {
                "address_id", "customer_id", "address_type", "raw_address",
                "address_line1", "address_line2", "city", "state", "postal_code",
                "country", "is_primary",
            },
            "customer_contacts": {
                "contact_id", "customer_id", "contact_name", "job_title",
                "contact_type", "email", "phone", "fax", "is_primary",
                "created_at", "updated_at",
            },
            "customer_banks": {
                "bank_id", "customer_id", "bank_name", "branch_name", "bank_address",
                "bank_country", "swift_bic_code", "account_no", "created_at", "updated_at",
            },
            "customer_identifiers": {
                "identifier_id", "customer_id", "identifier_type", "identifier_value",
                "issuing_country", "created_at", "updated_at",
            },
        },
    ),
    (
        "20261031_0004",
        {
            "hs_code_records": {
                "id", "sale", "customer", "commodity", "hs_code", "created_at", "updated_at",
            },
            "freetime_records": {
                "id", "carrier", "lat_krabang", "laem_chabang", "pat_bangkok",
                "songkla", "reefer", "remark", "dem_20_40", "dt_20_40",
                "dem_reefer", "det_reefer", "free_time_plug", "created_at", "updated_at",
            },
            "customers": {
                "customer_id", "customer_name", "customer_type", "raw_address",
                "address_line1", "address_line2", "city", "state", "postal_code",
                "country", "status", "created_at", "updated_at", "acid_no",
                "importer_no", "exporter_no", "uasc_no", "remark",
            },
            "customer_addresses": {
                "address_id", "customer_id", "address_type", "raw_address",
                "address_line1", "address_line2", "city", "state", "postal_code",
                "country", "is_primary",
            },
            "customer_contacts": {
                "contact_id", "customer_id", "contact_name", "job_title",
                "contact_type", "email", "phone", "fax", "is_primary",
                "created_at", "updated_at",
            },
            "customer_banks": {
                "bank_id", "customer_id", "bank_name", "branch_name", "bank_address",
                "bank_country", "swift_bic_code", "account_no", "created_at", "updated_at",
            },
            "customer_identifiers": {
                "identifier_id", "customer_id", "identifier_type", "identifier_value",
                "issuing_country", "created_at", "updated_at",
            },
        },
    ),
    (
        "20261031_0005",
        {
            "hs_code_records": {
                "id", "sale", "customer", "commodity", "hs_code", "created_at", "updated_at",
            },
            "freetime_records": {
                "id", "carrier", "lat_krabang", "laem_chabang", "pat_bangkok",
                "songkla", "reefer", "remark", "dem_20_40", "dt_20_40",
                "dem_reefer", "det_reefer", "free_time_plug", "created_at", "updated_at",
            },
            "customers": {
                "customer_id", "customer_name", "customer_type", "raw_address",
                "address_line1", "address_line2", "city", "state", "postal_code",
                "country", "status", "created_at", "updated_at", "acid_no",
                "importer_no", "exporter_no", "uasc_no", "remark",
            },
            "customer_addresses": {
                "address_id", "customer_id", "address_type", "raw_address",
                "address_line1", "address_line2", "city", "state", "postal_code",
                "country", "is_primary",
            },
            "customer_contacts": {
                "contact_id", "customer_id", "contact_name", "job_title",
                "contact_type", "email", "phone", "fax", "is_primary",
                "created_at", "updated_at",
            },
            "customer_banks": {
                "bank_id", "customer_id", "bank_name", "branch_name", "bank_address",
                "bank_country", "swift_bic_code", "account_no", "created_at", "updated_at",
            },
            "customer_identifiers": {
                "identifier_id", "customer_id", "identifier_type", "identifier_value",
                "issuing_country", "created_at", "updated_at",
            },
            "customer_trade_details": {
                "trade_detail_id", "customer_id", "acid_no", "importer_no",
                "exporter_no", "uasc_no", "remark",
            },
        },
    ),
]


def main() -> None:
    with engine.begin() as connection:
        inspector = inspect(connection)
        if not inspector.has_table("alembic_version"):
            print("No Alembic version table; normal initial migrations will run.")
            return

        current = connection.execute(
            text("SELECT version_num FROM alembic_version")
        ).scalars().all()
        known_revisions = {revision for revision, _ in REVISIONS}
        if current and all(revision in known_revisions for revision in current):
            print("Alembic version is recognized; no compatibility adjustment needed.")
            return
        if len(current) != 1:
            raise SystemExit(
                "Cannot safely reconcile legacy Alembic version: expected exactly "
                f"one current revision, found {current!r}. Database was not changed."
            )

        actual_columns = {
            table: {column["name"] for column in inspector.get_columns(table)}
            for table in inspector.get_table_names()
        }
        matches = [
            revision
            for revision, expected_schema in REVISIONS
            if all(
                table in actual_columns and columns <= actual_columns[table]
                for table, columns in expected_schema.items()
            )
        ]
        if not matches:
            raise SystemExit(
                f"Database revision {current[0]!r} is unknown and its schema does not "
                "match a known migration snapshot. Database was not changed; inspect "
                "the production schema before updating Alembic."
            )

        target = matches[-1]
        target_index = next(i for i, (revision, _) in enumerate(REVISIONS) if revision == target)
        existing_customer_tables = {
            "customers", "customer_addresses", "customer_contacts",
            "customer_banks", "customer_identifiers",
        } & actual_columns.keys()

        # Do not let a later create-table or add-column migration collide with a
        # partially present schema that does not match a complete known snapshot.
        if target_index < 2 and existing_customer_tables:
            raise SystemExit(
                "Customer tables exist but do not match a complete known migration "
                "snapshot. Database was not changed."
            )
        if target_index == 2:
            company_columns = {"acid_no", "importer_no", "exporter_no", "uasc_no", "remark"}
            present = company_columns & actual_columns.get("customers", set())
            if present and present != company_columns:
                raise SystemExit(
                    "Only some Company Information columns exist. Database was not changed."
                )
        if target_index == 3 and "customer_trade_details" in actual_columns:
            raise SystemExit(
                "customer_trade_details exists but does not match the known schema. "
                "Database was not changed."
            )

        connection.execute(
            text("UPDATE alembic_version SET version_num = :target WHERE version_num = :current"),
            {"target": target, "current": current[0]},
        )
        print(
            f"Mapped legacy Alembic revision {current[0]} to schema-equivalent "
            f"revision {target}; database records were not modified."
        )


if __name__ == "__main__":
    main()
