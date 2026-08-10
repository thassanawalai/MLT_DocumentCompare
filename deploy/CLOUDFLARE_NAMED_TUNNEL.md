# Pretty URL with Cloudflare Named Tunnel

Use this when you want a stable customer URL such as:

```text
https://mlt-demo.company.com
```

Keep the existing Quick Tunnel setup for temporary demos. Named Tunnel is the
cleaner option when customers need the same URL more than once.

## Requirements

- A Cloudflare account
- A domain added to Cloudflare, such as `company.com`
- The main app running with `docker compose up -d`

## Cloudflare setup

1. Open Cloudflare Zero Trust.
2. Go to `Networks` > `Tunnels`.
3. Create a tunnel, for example `mlt-demo`.
4. Choose Docker as the connector method.
5. Copy the tunnel token.
6. Add a public hostname:

```text
Subdomain: mlt-demo
Domain: company.com
Service type: HTTP
Service URL: http://mlt-demo-proxy:80
```

Cloudflare will create the DNS route for:

```text
https://mlt-demo.company.com
```

## Local setup

Set the tunnel token in your terminal:

PowerShell:

```powershell
$env:TUNNEL_TOKEN="your_real_token_here"
docker compose -f deploy/cloudflare/docker-compose.named-tunnel.yml up -d
```

Bash:

```bash
export TUNNEL_TOKEN="your_real_token_here"
docker compose -f deploy/cloudflare/docker-compose.named-tunnel.yml up -d
```

Start the main app:

```bash
docker compose up -d --build
```

Start the named tunnel:

```bash
docker compose -f deploy/cloudflare/docker-compose.named-tunnel.yml logs --tail=100 cloudflared
```

Open:

```text
https://mlt-demo.company.com
```

## Stop access

```bash
docker compose -f deploy/cloudflare/docker-compose.named-tunnel.yml down
```

## Notes

- Do not commit the tunnel token.
- The existing app ports remain local-only:
  - Frontend: `127.0.0.1:8080`
  - Backend: `127.0.0.1:10000`
- The Nginx proxy keeps one public URL working for both `/` and `/api/`.
