# Multi-tenant demo platform

One deployment that renders a polished, on-brand demonstration site for many
businesses. The tenant is resolved from the requested hostname at request time,
its record is loaded, and the same code renders whatever that record describes.
Onboarding a business is **adding one data record** — no build, no deploy, no
branch.

These are first-impression surfaces (sent cold, e.g. over a DM), so each page is
server-rendered, ships effectively no client JavaScript, needs no account, and
loads fast on a mid-range phone.

## Principles

- **No brand lives in the source.** A business's name, words, colours, type,
  services, prices, images, language and text direction are all data. Searching
  the code for a real brand returns nothing.
- **Composed from little.** Presentation is driven by tokens. A tenant that
  supplies only a name and one colour still renders as something confident: the
  rest of the palette is derived (accessibly), and every section that lacks data
  simply disappears — never an empty frame.
- **Small.** No CMS, no admin panel, no abstraction for a problem we don't have.
- **Safe & honest.** Every page is marked as a GrindCTRL demo (not the
  business's own site), is `noindex`, and can be taken offline instantly.

## How it works

| Concern | Where |
|---|---|
| Hostname → tenant key | [`middleware.ts`](./middleware.ts) |
| Load / normalise a record (graceful degradation) | [`lib/tenant.ts`](./lib/tenant.ts) |
| Palette derivation + contrast | [`lib/color.ts`](./lib/color.ts) |
| Record → CSS custom properties | [`lib/tokens.ts`](./lib/tokens.ts) |
| Design-system defaults (Tailwind v4 `@theme`) | [`app/globals.css`](./app/globals.css) |
| Per-tenant `<html dir lang>` + tokens + demo mark + noindex | [`app/layout.tsx`](./app/layout.tsx) |
| Render sections in order (each self-omitting) | [`app/page.tsx`](./app/page.tsx), [`components/sections/`](./components/sections) |
| Caddy on-demand-TLS gate | [`app/api/tls-check/route.ts`](./app/api/tls-check/route.ts) |
| Onboarding + kill switch | [`scripts/`](./scripts) |
| Tenant record schema + how-to | [`examples/README.md`](./examples/README.md) |

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · Prisma · SQLite.

## Local development

```bash
npm install
npx prisma migrate dev            # creates prisma/dev.db
export DATABASE_URL="file:./prisma/dev.db"

# add a tenant from a record
npm run tenant:upsert -- ./examples/example.tenant.json

npm run dev                       # http://localhost:3000
```

Visit a tenant locally by using its subdomain against `localhost`:

```bash
curl -H "Host: example.grindctrl.cloud" http://localhost:3000
# or open http://example.localhost:3000 in a browser
```

## Adding a business

Write one JSON record and run one command — details and the full schema are in
[`examples/README.md`](./examples/README.md):

```bash
npm run tenant:upsert -- ./acme.json     # live at https://acme.grindctrl.cloud
npm run tenant:offline -- acme           # instant, per-tenant kill switch
npm run tenant:list                      # inventory
```

Real tenant records are **data on the server**, never committed to this repo.

## Deployment

Docker Compose (the app + Caddy with on-demand TLS) — see
[`deploy/README.md`](./deploy/README.md). Requires a wildcard
`*.<base-domain>` DNS record pointing at the host. `BASE_DOMAIN` and
`DATABASE_URL` are set via the environment.
