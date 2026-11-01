#!/bin/sh
set -e

python scripts/reconcile_alembic_revision.py
alembic upgrade head
python scripts/verify_customer_company_fields.py
python scripts/import_master_data.py --if-empty
python scripts/seed_customers.py --workbook /import-data/customer_import_template.xlsx --if-empty
