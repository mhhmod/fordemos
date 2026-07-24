#!/usr/bin/env bash
#
# End-to-end go-live for the first tenant. Run on the VPS after cloning:
#
#   cd fordemos && sudo bash deploy/golive.sh "Exact Business Name"
#
# It installs Docker if needed, brings up the app + Caddy (without clobbering
# anything already on :80/:443), writes a minimal tenant record if you don't
# provide one, and onboards it. Re-run the upsert any time with a richer record.
set -euo pipefail

NAME="${1:-}"
HERE="$(cd "$(dirname "$0")" && pwd)" # .../deploy
cd "$HERE"

echo "==> Docker check"
if ! command -v docker >/dev/null 2>&1; then
  echo "   Installing Docker..."
  curl -fsSL https://get.docker.com | sh
fi

echo "==> Bringing up the platform (app + Caddy)"
bash "$HERE/bootstrap.sh"

REC="$HERE/lokal.json"
if [ ! -f "$REC" ]; then
  if [ -z "$NAME" ]; then
    echo "==> No $REC and no name given."
    echo "    Create deploy/lokal.json, or re-run: sudo bash deploy/golive.sh \"Business Name\""
    exit 0
  fi
  cat > "$REC" <<JSON
{
  "id": "lokal",
  "locale": { "lang": "en", "dir": "ltr" },
  "brand": { "name": "${NAME}" },
  "theme": { "palette": { "primary": "#1f6f4a" } }
}
JSON
  echo "==> Wrote starter ${REC} (name: ${NAME}). Edit it and re-run the upsert to enrich."
fi

echo "==> Onboarding tenant 'lokal'"
docker compose cp "$REC" app:/tmp/lokal.json
docker compose exec -T app npm run tenant:upsert -- /tmp/lokal.json

cat <<'DONE'

==> Done.
    Ensure DNS is set:  *.grindctrl.cloud  A  <this server's IP>
    Then open:          https://lokal.grindctrl.cloud
    Enrich later:       edit deploy/lokal.json and re-run:
                          docker compose cp ./lokal.json app:/tmp/lokal.json
                          docker compose exec app npm run tenant:upsert -- /tmp/lokal.json
DONE
