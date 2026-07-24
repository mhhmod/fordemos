# Deploying the platform

One host runs two containers: the Next.js app and Caddy (TLS + reverse proxy).
Certificates are issued on demand, so **adding a tenant later needs no change
here** — no new cert, no proxy edit, no redeploy.

## Prerequisites

1. **Docker** with the Compose plugin.
2. **Wildcard DNS.** Point both of these at the host's public IP:
   - `grindctrl.cloud        A   <IP>`
   - `*.grindctrl.cloud      A   <IP>`

   The wildcard is what makes every future tenant subdomain resolve with zero
   DNS work. Certificates are then minted automatically on first visit.

## First deploy

```bash
# on the host
mkdir -p /srv/grindctrl/data /srv/grindctrl/caddy/data /srv/grindctrl/caddy/config

# get the code here (git clone or copy the working tree), then:
cd deploy
docker compose up -d --build
```

The app applies its database migration on start and creates the SQLite store at
`/srv/grindctrl/data/app.db`. Check health:

```bash
docker compose ps
docker compose logs -f app
curl -sI -H "Host: grindctrl.cloud" http://localhost      # 308 → https
```

## Onboard a tenant (data only — no redeploy)

Copy a record into the app container and upsert it:

```bash
docker compose cp ./acme.json app:/tmp/acme.json
docker compose exec app npm run tenant:upsert -- /tmp/acme.json
```

It is immediately live at `https://acme.grindctrl.cloud` (the cert is issued on
the first HTTPS hit). See [`../examples/README.md`](../examples/README.md) for the
record schema.

## Operate

```bash
docker compose exec app npm run tenant:list               # inventory
docker compose exec app npm run tenant:offline -- acme   # instant kill switch
docker compose exec app npm run tenant:online  -- acme
```

## Configuration

| Env (on the `app` service) | Purpose |
|---|---|
| `BASE_DOMAIN` | Domain that subdomains resolve under (default `grindctrl.cloud`). |
| `DATABASE_URL` | SQLite location (`file:/data/app.db`, on the mounted volume). |

Set the ACME account email in [`Caddyfile`](./Caddyfile).

## Backups & persistence

Everything stateful is on host volumes and survives `up --build`:

- `/srv/grindctrl/data/app.db` — the tenant store (back this up).
- `/srv/grindctrl/caddy/data` — issued TLS certificates.

## Updating the app

```bash
# pull/copy new code, then:
cd deploy && docker compose up -d --build
```

Tenants are untouched — they live in the database volume, not the image.

## Security

- Prefer key-based SSH; disable password login once keys are in place.
- Nothing brand-bearing or secret is committed to the repo; tenant records and
  the database live only on the host.
