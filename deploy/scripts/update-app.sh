#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${1:-/opt/mlt}"

cd "$APP_DIR"
git pull
docker compose up -d --build
docker compose ps
