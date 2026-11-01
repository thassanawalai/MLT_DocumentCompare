"""Fail deployment early when required customer company fields are missing."""

from sqlalchemy import inspect

from app.db import engine


REQUIRED_COLUMNS = {
    "customers": {
        "acid_no",
        "importer_no",
        "exporter_no",
        "uasc_no",
        "remark",
    }
}


def main() -> None:
    inspector = inspect(engine)
    missing = []
    for table, expected_columns in REQUIRED_COLUMNS.items():
        if not inspector.has_table(table):
            missing.append(f"{table} (table missing)")
            continue
        actual_columns = {column["name"] for column in inspector.get_columns(table)}
        missing.extend(
            f"{table}.{column}"
            for column in sorted(expected_columns - actual_columns)
        )

    if missing:
        raise SystemExit(
            "Database schema is missing required Company Information columns: "
            + ", ".join(missing)
            + ". Check that Alembic migrations ran against the same DATABASE_URL "
              "used by the API."
        )

    print("Customer Company Information database columns are present.")


if __name__ == "__main__":
    main()
