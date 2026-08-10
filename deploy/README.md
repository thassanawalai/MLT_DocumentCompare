# Production deployment (Ubuntu + Nginx + Docker)

This deployment exposes only Nginx on ports 80 and 443. Docker publishes the
frontend and backend only on `127.0.0.1`, so they cannot be reached directly
from the Internet.

## 1. Prepare DNS and the server

1. Create an `A` record for `mlt.company.com` pointing at the server public IP.
2. In the cloud firewall/security group and Ubuntu UFW, allow TCP 22 (restricted
   to administrator IPs where possible), 80 and 443. Do **not** allow 8080,
   10000 or 11434.
3. Install Docker Engine with the Compose plugin, Nginx and Certbot:

   ```bash
   sudo apt update
   sudo apt install -y nginx certbot python3-certbot-nginx
   # Install Docker Engine using Docker's official Ubuntu instructions.
   ```

## 2. Deploy the application

```bash
git clone <YOUR-REPOSITORY-URL> /opt/mlt
cd /opt/mlt
cp .env.example .env
nano .env
sudo docker compose up -d --build
sudo docker compose ps
```

If the application uses Ollama, it must be reachable by the backend. For Ollama
running on the same host, run the backend with Docker's host-gateway mapping:

```bash
sudo docker compose up -d --build --force-recreate
```

The compose file maps `host.docker.internal` to Docker's host gateway. If
Ollama runs on another private server, set `OLLAMA_HOST` to that private URL
instead. If Ollama is not used, no additional service is needed.

## 3. Enable HTTPS

Replace every `mlt.company.com` in `deploy/nginx/mlt.conf` with the real domain,
then install it:

```bash
sudo mkdir -p /var/www/certbot
sudo cp deploy/nginx/mlt-http.conf /etc/nginx/sites-available/mlt
sudo ln -s /etc/nginx/sites-available/mlt /etc/nginx/sites-enabled/mlt
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
# DNS must already point to this server and port 80 must be publicly reachable.
sudo certbot certonly --webroot -w /var/www/certbot -d mlt.company.com
sudo cp deploy/nginx/mlt.conf /etc/nginx/sites-available/mlt
sudo nginx -t
sudo systemctl reload nginx
```

Check renewal once:

```bash
sudo certbot renew --dry-run
```

## Verification

```bash
curl -I https://mlt.company.com
curl -I https://mlt.company.com/api/v1/templates
sudo ss -ltnp | grep -E ':(80|443|8080|10000)'
```

The first two commands should succeed. The socket check should show 80/443
listening publicly and 8080/10000 bound to `127.0.0.1` only.
