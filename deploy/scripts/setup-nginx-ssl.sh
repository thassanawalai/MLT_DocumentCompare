#!/usr/bin/env bash
set -euo pipefail

DOMAIN="${1:-}"
EMAIL="${2:-}"
APP_DIR="${3:-/opt/mlt}"

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
  echo "Usage: sudo bash deploy/scripts/setup-nginx-ssl.sh <domain> <email> [app_dir]"
  echo "Example: sudo bash deploy/scripts/setup-nginx-ssl.sh mlt.company.com admin@company.com"
  exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
  echo "Please run this script with sudo."
  exit 1
fi

if [ ! -d "$APP_DIR/deploy/nginx" ]; then
  echo "App directory not found or missing deploy/nginx: $APP_DIR"
  exit 1
fi

apt update
apt install -y nginx certbot

mkdir -p /var/www/certbot

sed "s/mlt.company.com/$DOMAIN/g" "$APP_DIR/deploy/nginx/mlt-http.conf" > /etc/nginx/sites-available/mlt
ln -sfn /etc/nginx/sites-available/mlt /etc/nginx/sites-enabled/mlt
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl reload nginx

certbot certonly \
  --webroot \
  -w /var/www/certbot \
  -d "$DOMAIN" \
  --email "$EMAIL" \
  --agree-tos \
  --no-eff-email

sed "s/mlt.company.com/$DOMAIN/g" "$APP_DIR/deploy/nginx/mlt.conf" > /etc/nginx/sites-available/mlt

nginx -t
systemctl reload nginx
certbot renew --dry-run

echo "Done. Open: https://$DOMAIN"
