#!/usr/bin/env bash
#
# One-shot deploy for the multi-tenant demo platform. Run on the VPS, from the
# repo's deploy/ directory:
#
#   cd fordemos/deploy && sudo bash bootstrap.sh
#
# It is deliberately conservative: it refuses to run if something is already
# listening on :80 or :443, so it never clobbers an existing web server.
set -euo pipefail

BASE_DIR="/srv/grindctrl"
HERE="$(cd "$(dirname "$0")" && pwd)"

echo "==> Checking Docker + Compose"
if ! command -v docker >/dev/null 2>&1; then
  echo "   Docker is not installed. Install it with:"
  echo "     curl -fsSL https://get.docker.com | sh"
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "   The Docker Compose plugin is missing (need 'docker compose')."
  exit 1
fi

echo "==> Checking ports 80 and 443 are free"
if ss -ltn 2>/dev/null | grep -qE ':(80|443) '; then
  echo "   !! Something is already listening on :80 and/or :443:"
  ss -ltnp 2>/dev/null | grep -E ':(80|443) ' || true
  echo "   !! Caddy needs both ports. Stop or relocate the existing service and"
  echo "      re-run. Aborting so nothing already running is disturbed."
  exit 1
fi

echo "==> Creating persistent data directories under $BASE_DIR"
mkdir -p "$BASE_DIR/data" "$BASE_DIR/caddy/data" "$BASE_DIR/caddy/config"

echo "==> Building and starting (app + caddy)"
cd "$HERE"
docker compose up -d --build

echo "==> Running. Current status:"
docker compose ps

cat <<'NEXT'

==> Deploy complete.

Two things remain to go live:

  1. DNS — add a wildcard record at your DNS provider:
         *.<base domain>   A   <this server's public IP>
     (Caddy then issues each subdomain's TLS certificate automatically.)

  2. Onboard the first tenant (data only — no redeploy):
         docker compose cp ./<slug>.json app:/tmp/tenant.json
         docker compose exec app npm run tenant:upsert -- /tmp/tenant.json

     It is then live at https://<slug>.<base domain>

Manage tenants any time:
     docker compose exec app npm run tenant:list
     docker compose exec app npm run tenant:offline -- <slug>  # instant kill switch
NEXT
