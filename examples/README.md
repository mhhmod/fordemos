# Adding a business = writing one record

A tenant is **data**, never code. To onboard a business you write one JSON
record and run one command. Nothing in `app/`, `components/`, or `lib/` changes;
there is no build, no deploy, and no branch. Onboarding takes minutes and needs
no engineering judgement.

```bash
# from the server (or anywhere with DATABASE_URL pointing at the SQLite file)
npm run tenant:upsert -- ./acme.json
```

That record is now live at `https://<id>.grindctrl.cloud`. The wildcard DNS
already routes the subdomain, Caddy mints its TLS certificate on the first
visit, and the app reads the record at request time.

## The record

Everything a brand owns is here as data. Every field is optional **except
`id`**. Anything you leave out (or leave empty) is either derived or its section
simply disappears — a page never shows an empty frame or a placeholder a
stranger could see.

| Field | Meaning |
|---|---|
| `id` | **Required.** The subdomain label — reachable at `<id>.grindctrl.cloud`. Lowercase letters, digits, hyphens. |
| `status` | `"published"` (default) or `"offline"` (the instant kill switch). |
| `hostnames` | Optional extra custom domains, e.g. `["www.acme.com"]`. |
| `locale.lang` | BCP-47 language tag, e.g. `"en"`, `"ar"`. |
| `locale.dir` | `"ltr"` (default) or `"rtl"`. Drives text direction across the whole page from one value. |
| `brand.name` | Display name. If absent, the `id` is titled-cased. |
| `brand.tagline` | Short line under/near the name. |
| `brand.logo.src` / `.alt` | Logo image URL. **Missing → a typographic wordmark from the name.** |
| `theme.palette.primary` | Your main brand colour (hex). A whole accessible palette is derived from just this. |
| `theme.palette.bg` `text` `accent` `surface` `border` `onPrimary` `muted` | Any subset; the rest are derived. A dark `bg` automatically flips text light. |
| `theme.font.heading` / `.body` | Font family names. |
| `theme.font.url` | Optional `https` stylesheet (e.g. a Google Fonts URL) loaded only if present. |
| `theme.radius` | Corner radius, e.g. `"18px"`. |
| `sections.order` | Optional array to reorder sections. Unknown keys are ignored. |
| `sections.hero` | `headline` (falls back to tagline → name), `sub`, `image` (absent → a tasteful token gradient), up to 3 `ctas` of `{label, href}`. |
| `sections.about` | `title?`, `body`. Renders only with a `body`. |
| `sections.services` | `title?`, `items[]` of `{name, desc?, price?}`. Renders with ≥1 named item; a price shows only when present. |
| `sections.gallery` | `title?`, `images[]` of `{src, alt}`. Renders with ≥1 valid image. |
| `sections.hours` | `title?`, `rows[]` of `{label, value}`. Renders with ≥1 complete row. |
| `sections.contact` | `title?`, `phone?`, `email?`, `address?`, `map?`, `socials[]` of `{type, href}`. Renders if it has ≥1 detail. Socials are shown as icons — `type` is one of `instagram, facebook, whatsapp, tiktok, x, youtube, linkedin, telegram, snapchat, website`. |
| `demo.note` | Optional override for the demo-mark's descriptive line (useful for localising it). |

See [`example.tenant.json`](./example.tenant.json) for a full template.

## The smallest possible record

This is valid and renders a complete, composed page — derived palette, a
wordmark from the name, and every empty section cleanly absent:

```json
{ "id": "acme", "brand": { "name": "Acme Bakery" } }
```

## A right-to-left tenant

Direction is one field. The same components and the same stylesheet render
mirrored — nothing else changes:

```json
{
  "id": "noor",
  "locale": { "lang": "ar", "dir": "rtl" },
  "brand": { "name": "نور", "tagline": "حلويات ومخبوزات" },
  "theme": { "palette": { "primary": "#0f7a6a" } }
}
```

## Taking a tenant offline (instantly)

```bash
npm run tenant:offline -- acme     # down within ~1s, no redeploy
npm run tenant:online  -- acme     # back up
npm run tenant:list                # see everything and its status
```

Offline tenants serve a neutral "preview unavailable" page that reveals nothing
about the business. No other tenant is affected.
