# PostgreSQL setup

The backend uses SQLAlchemy and Alembic. Schema changes are tracked in `backend/migrations`.

## Local development with Docker Compose

The Compose file starts PostgreSQL with a named volume so the database survives container restarts. The credentials in Compose are for local development only.

From the repository root, run:

```powershell
docker compose up -d db
docker compose run --rm backend alembic upgrade head
docker compose up -d
```

The Compose host ports are `10001` for the backend and `8081` for the frontend to avoid the existing services on `10000` and `8080`. The containers still communicate over the internal backend port `10000`.

The migrations create:

- `hs_code_records`: HS Code master data, with a generated ID and indexes on HS Code and customer.
- `freetime_records`: port freetime data, with a generated ID and an index on carrier.
- `customers`, `customer_addresses`, `customer_contacts`, `customer_banks`, and `customer_identifiers`: customer master data and its related records.
- `alembic_version`: Alembic's record of the current schema revision.

## Import the existing master files

The repository's current Freetime source is named `freetime_data.xlsx`, but its contents are CSV text rather than an XLSX workbook. The importer detects this and also supports a real XLSX file. Import the current source files once:

```powershell
docker compose build backend
docker compose run --rm backend alembic upgrade head
docker compose run --rm backend python scripts/import_master_data.py
```

The Compose service mounts `frontend/public` read-only into the importer container. The importer skips empty source rows, carries a blank Carrier cell forward as the current Freetime page does, and preserves the `FREE TIME PLUG` column. It inserts both datasets in one transaction and refuses to run if either destination table already contains rows.

Import the customer workbook once, after applying migrations:

```powershell
docker compose build backend
docker compose run --rm backend alembic upgrade head
docker compose run --rm backend python scripts/seed_customers.py
```

The customer importer reads `637232394860757623_DETAIL CUSTOMER_9096.xlsx` from the mounted `frontend/public` directory. It treats blank rows as customer boundaries and imports addresses, contact email/phone, banks, and common tax or registration identifiers. It refuses to duplicate an existing customer dataset. To intentionally replace the customer records with a fresh import from that workbook, pass `--replace`.

For new or corrected customer data, use `backend/master_data/customer_import_template.xlsx`. The local Compose service mounts `backend/master_data` read-only at `/master-data`, so edits to this workbook do not require rebuilding the image. Fill one company per row in `Customers`; put each address, contact method, bank, and identifier on its own row in the corresponding sheet, repeating the exact `customer_name` to link it. Check the filled file before importing:

```powershell
docker compose run --rm backend python scripts/seed_customers.py --workbook /master-data/customer_import_template.xlsx --dry-run
```

When the dry-run counts look right, import the new workbook. Use `--replace` only if you intend to replace the customer records currently in the database:

```powershell
docker compose run --rm backend python scripts/seed_customers.py --workbook /master-data/customer_import_template.xlsx --replace
```

Connect to the local database at `localhost:5432` with database `mlt_documentcompare`, user `mlt_user`, and password `mlt_password`. To inspect it with psql, run `docker compose exec db psql -U mlt_user -d mlt_documentcompare`.

## Existing PostgreSQL server or hosted database

Set `DATABASE_URL` on the backend to a PostgreSQL connection string, for example:

```text
postgresql+psycopg://USER:PASSWORD@HOST:5432/DATABASE
```

Then run the migration from the backend directory:

```powershell
alembic upgrade head
```

For Render, `render.yaml` defines a Free PostgreSQL database and connects its private connection string to the backend. The backend deploy runs Alembic migrations and imports the seed files from `backend/master_data` if the tables are empty. When updating the original master files, copy the updated files into `backend/master_data` too. Free Postgres is for trials: it expires 30 days after creation, then Render gives 14 days to upgrade before deleting the database and its data. Export or otherwise retain any edits you want to keep before expiry. The backend web service remains on its existing `starter` plan; changing the database plan does not make that service free. Keep hosted credentials out of source control.

## Schema changes

Do not use `Base.metadata.create_all()` for deployment. Create a new Alembic revision for each schema change, review it, then apply it with `alembic upgrade head`.

## Master-data API

The FastAPI routes use snake_case JSON fields and the database-generated record ID:

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/v1/hs-codes` | List HS Code rows |
| `POST` | `/api/v1/hs-codes` | Add an HS Code row |
| `PATCH` | `/api/v1/hs-codes/{id}` | Update supplied fields on one HS Code row |
| `DELETE` | `/api/v1/hs-codes/{id}` | Delete one HS Code row |
| `GET` | `/api/v1/freetime` | List Freetime rows |
| `POST` | `/api/v1/freetime` | Add a Freetime row |
| `PATCH` | `/api/v1/freetime/{id}` | Update supplied fields on one Freetime row |
| `DELETE` | `/api/v1/freetime/{id}` | Delete one Freetime row |
| `GET` | `/api/v1/customers/search?keyword=...` | Search customers across company and related data, returning nested addresses, contacts, banks, and identifiers |

For example, an HS Code create body uses `sale`, `customer`, `commodity`, and `hs_code`. Both the HS Code and Freetime pages use these routes for listing, adding, editing, and deleting records.
