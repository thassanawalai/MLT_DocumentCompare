#!/bin/sh
set -e

alembic upgrade head
python scripts/import_master_data.py --if-empty
