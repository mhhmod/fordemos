#!/usr/bin/env bash
#
# End-to-end go-live for a first tenant on a FRESH host (nothing on :80/:443).
# If the host already runs a reverse proxy, use deploy/compose.traefik.yml
# instead — see deploy/README.md.
#
#   cd fordemos && sudo bash deploy/golive.sh <slug> "Exact Business Name"
#
# <slug> is the subdomain label the tenant is served at: <slug>.<base domain>.
# It installs Docker if needed, brings up the app + Caddy (without clobbering
# anything already on :80/:443), writes a minimal record if you do not already
# have one, and onboards it. Re-run the upsert any time with a richer record.
set -euo pipefail

SLUG="${1:-}"
NAME="${2:-}"
HERE="$(cd "$(dirname "$0")" && pwd)" # .../deploy
cd "$HERE"

if [ -z "$SLUG" ]; then
  echo "Usage: sudo bash deploy/golive.sh <slug> \"Business Name\""
  echo "  <slug> is the subdomain label, e.g. 'acme' for acme.example.com"
  exit 1
fi

case "$SLUG" in
  [a-z0-9] | [a-z0-9][a-z0-9-]*[a-z0-9]) ;;
  *)
    echo "!! <slug> must be lowercase letters, digits and hyphens."
    exit 1
    ;;
esac

echo "==> Docker check"
if ! command -v docker >/dev/null 2>&1; then
  echo "   Installing Docker..."
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Bringing up the platform (app + Caddy)"
bash "$HERE/bootstrap.sh"

BASE="$(sed -n 's/.*BASE_DOMAIN: "\([^"]*\)".*/\1/p' "$HERE/docker-compose.yml" | head -1)"
BASE="${BASE:-<your base domain>}"

REC="$HERE/${SLUG}.json"
if [ ! -f "$REC" ]; then
  if [ -z "$NAME" ]; then
    echo "==> No $REC and no name given."
    echo "    Create it, or re-run: sudo bash deploy/golive.sh $SLUG \"Business Name\""
    exit 0
  fi
  cat > "$REC" <<JSON
{
  "id": "${SLUG}",
  "locale": { "lang": "en", "dir": "ltr" },
  "brand": { "name": "${NAME}" }
}
JSON
  echo "==> Wrote starter ${REC}. Edit it and re-run the upsert to enrich."
fi

echo "==> Onboarding tenant '${SLUG}'"
docker compose cp "$REC" app:/tmp/tenant.json
docker compose exec -T app npm run tenant:upsert -- /tmp/tenant.json

cat <<DONE

==> Done.
    Ensure DNS is set:  *.${BASE}  A  <this server's IP>
    Then open:          https://${SLUG}.${BASE}
    Enrich later:       edit ${REC} and re-run:
                          docker compose cp "${REC}" app:/tmp/tenant.json
                          docker compose exec app npm run tenant:upsert -- /tmp/tenant.json
DONE
