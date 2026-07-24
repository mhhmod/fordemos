# Tenant audit surface — design

**Date:** 2026-07-25
**Status:** approved, ready for implementation plan

## Problem

The platform currently renders one kind of page: a brochure (hero / about / services / gallery / hours / contact). For the first tenant — a business that already operates a working online store — a brochure demonstrates nothing. It restates what the owner already knows and reads as an unsolicited redesign pitch.

The surface is a cold first-contact sent by direct message to someone who has never heard of the sender. Its job is to prove value has *already* been delivered, before anything is asked for.

The brochure also failed on its own terms: three of the six products it promoted are fully sold out on the real store, so it advertised items nobody can buy.

## Goal

Render an **audit** of the tenant's own business from data that is publicly observable, presented as recoverable opportunity rather than fault, ending in one low-friction call to action.

This must not become a second product. It is four more section types in the existing section list.

## Non-goals

- No live third-party integration at request time. Findings are measured offline and stored as tenant data.
- No admin UI, no content management, no login, no analytics backend.
- No per-tenant code, routes, files, or branches. Nothing identifying a business appears in source.
- No generalisation beyond multi-tenancy. The audit tool is a dev script, not a served subsystem.

## Approach

The existing architecture already models a page as an ordered list of optional sections, each rendering only when it holds renderable data and vanishing cleanly otherwise. The audit fits that model exactly.

Chosen: **add four section types to the existing list.**

Rejected alternatives:

- *A separate page template selected per tenant* (`template: "audit" | "brochure"`) — introduces a second renderer and a template concept for a distinction that the `order` array already expresses.
- *Replace the brochure entirely* — some tenants (a restaurant, a clinic) have no catalogue to audit; the brochure sections stay correct for them.

A tenant with a catalogue orders `hero, stats, findings, breakdown, cta`. A tenant without one orders `hero, about, services, contact`. Same code, no switch.

## Changes

| Area | Change |
|---|---|
| `prisma/schema.prisma`, `proxy.ts`, tenant resolution | unchanged |
| `lib/tenant.ts` | four new section types added to `normalizeTenant`, same validation helpers and degrade rules |
| `components/sections/` | new `Stats`, `Findings`, `Breakdown`, `Cta` components |
| `app/page.tsx` | four entries added to the section map |
| `lib/tokens.ts` | unchanged — new sections consume existing tokens |
| `scripts/audit-shopify.ts` | new dev-only tool; takes a store domain argument, emits findings JSON; contains no business-specific values |

### Section shapes

```
stats:     { title?, items: [{ label, value, note?, emphasis? }] }
findings:  { title?, items: [{ title, detail, action?, rank? }] }
breakdown: { title?, note?, rows: [{ label, value, max?, caption? }] }
cta:       { title?, body?, actions: [{ label, href }] }
```

`value` in `stats` is a display string (already formatted, e.g. `"82%"`), so the renderer never does unit or locale maths on a tenant's behalf.
`value`/`max` in `breakdown` are numbers; the bar width is `clamp(0, value/max, 1)`.

`emphasis?` on a stat item is a boolean. When true the tile's value takes the accent token instead of the foreground token; it marks a figure that reads as a strength. It carries no other meaning and defaults to false.

`rank?` on a finding is an optional display string (e.g. `"01"`). When absent the renderer numbers items by their position in the array, so a record never has to maintain numbering by hand. It expresses order only — it is not a severity scale and drives no colour.

### Degradation rules

Consistent with existing sections:

- A section renders only if it has at least one valid item, otherwise it is `undefined` and never appears.
- Items missing a required field are dropped individually: `label`+`value` for stats, `title` for findings, `label`+finite non-negative `value` for breakdown rows, `label`+safe `href` for cta actions. A stat tile without a value would be an empty frame, so both fields are required.
- `max` defaults to the largest `value` in the set; if all values are 0 or non-numeric, the section vanishes rather than drawing empty bars.
- `cta` actions reuse `safeUrl`, so only `http`, `https`, `mailto`, `tel`, and root-relative links are emitted.
- Malformed input never throws; a broken record still renders a composed page.

### Presentation

- Severity is expressed as editorial rank (`01`, `02`, `03`) plus the accent token — **not** red/amber/green. Hardcoded semantic colours would override tenant theming and break the token contract.
- Bars use `--color-accent`; surfaces and text use existing `--color-canvas`, `--color-fg`, `--color-muted`, `--color-line`.
- Every bar states its value as text, not width alone.
- Stat tiles reflow one-to-four columns across 320–1440.
- Labels wrap rather than truncate, so Arabic expansion and long tenant strings stay readable.

## Honesty constraints

This surface makes factual claims about a real third party, so:

- Every figure carries the date it was measured and the fact that it came from public catalogue data.
- Wording states what is observable to a shopper ("size options not purchasable") rather than inferring internal causes ("you are out of stock"), because an unavailable Shopify variant can also mean untracked or archived inventory.
- Claims are validated against an independent signal before shipping. For the first tenant, product-level `availability` in the store's own schema.org markup was compared with the catalogue endpoint across nine products; all nine agreed.
- At least one finding reflects a genuine strength, so the page reads as a review rather than an attack.
- The existing demonstration mark, `noindex`, and per-tenant kill switch continue to apply unchanged.

## Verification

One runnable check, `node --test`, over `normalizeTenant`:

- empty, absent, and malformed audit sections normalise to `undefined`
- valid sections normalise with invalid items dropped
- `breakdown` with all-zero or non-numeric values vanishes
- `cta` drops unsafe hrefs (`javascript:`) and keeps safe ones

Manual: render at 320 / 390 / 768 / 1280, confirm no horizontal overflow and no empty frames; confirm a tenant record with no audit sections still renders the brochure unchanged.

## First tenant record (data only)

Measured 2026-07-25 from the store's public catalogue: 144 products, 3,019 variants.

- 2,471 of 3,019 size options not purchasable (82%)
- 40 products fully unavailable but still listed (28%)
- 132 of 144 products with no meaningful description (92%)
- 54 of 144 uncategorised (37%)
- Size run: White/XL 85%, Black/XL 81%, White/L 75%, Black/L 74%, White/M 70%, Black/M 61% unavailable
- Strength: 50 independent brands, 141 releases in 90 days

Call to action: reply to the direct message.

## Adding the next business

Unchanged from the original design: author a JSON record, run the upsert, done. The audit sections are optional data like every other section, so a tenant without a catalogue simply omits them.
