# Demo deploy with Cloudflare Tunnel

This mode is for demos, trials, and customer access during working hours from
the company computer. It keeps the existing `docker-compose.yml` unchanged:

- Frontend: `127.0.0.1:8080`
- Backend: `127.0.0.1:10000`

The public URL is created by Cloudflare Quick Tunnel and looks like:

```text
https://random-name.trycloudflare.com
```

## Start the app

Run the main app first:

```bash
docker compose up -d --build
docker compose ps
```

Check locally:

```bash
curl -I http://127.0.0.1:8080
curl -I http://127.0.0.1:10000/api/v1/templates
```

## Start the tunnel

Run the demo tunnel stack:

```bash
docker compose -f deploy/cloudflare/docker-compose.tunnel.yml up -d
docker compose -f deploy/cloudflare/docker-compose.tunnel.yml logs --tail=100 cloudflared
```

Look for a URL that ends with:

```text
.trycloudflare.com
```

Send that URL to the customer.

If the URL does not appear yet, wait a few seconds and run:

```bash
docker compose -f deploy/cloudflare/docker-compose.tunnel.yml logs --tail=200 cloudflared
```

`logs -f` is allowed too, but it will keep waiting forever because it follows
the running tunnel process.

## Stop customer access

Stop only the public tunnel:

```bash
docker compose -f deploy/cloudflare/docker-compose.tunnel.yml down
```

The main app containers can stay running locally.

To stop everything:

```bash
docker compose -f deploy/cloudflare/docker-compose.tunnel.yml down
docker compose down
```

## Why there is an extra proxy

The frontend calls the backend with a relative URL: `/api/v1/process-pdf`.
Cloudflare Quick Tunnel exposes one local service URL at a time, so this demo
stack adds a small Nginx proxy:

- `/` goes to the frontend container
- `/api/` goes to the backend container

That keeps the public customer URL simple and avoids rebuilding the frontend
whenever Cloudflare gives a new temporary `trycloudflare.com` URL.

## Troubleshooting

If the tunnel stack says the `mlt_default` network does not exist, start the
main app first:

```bash
docker compose up -d
```

If your Docker Compose project name changes, check the real network name:

```bash
docker network ls
```

Then update `deploy/cloudflare/docker-compose.tunnel.yml` under
`networks.mlt_app.name`.
