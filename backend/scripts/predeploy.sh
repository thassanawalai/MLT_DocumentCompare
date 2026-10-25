#!/bin/sh
set -e

alembic upgrade head
python scripts/import_master_data.py --if-empty
python scripts/seed_customers.py --workbook /import-data/customer_import_template.xlsx --if-empty
