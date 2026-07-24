# Tenant Audit Surface Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let a tenant record render an audit of its own business — headline metrics, ranked findings, a distribution chart and a closing call to action — using four new optional section types, so a tenant that already runs an online store is shown something it does not already know.

**Architecture:** The app already models a page as an ordered list of optional sections that render only when they hold data and vanish otherwise. This adds four section types to that same list — `stats`, `findings`, `breakdown`, `cta` — with no second renderer, no template flag and no per-tenant code. The pure normalisation logic is first extracted from `lib/tenant.ts` into `lib/normalize.ts` so it can be unit-tested without pulling in `server-only`, Prisma and `next/headers`.

**Tech Stack:** Next.js 16 (App Router, server components), TypeScript, Tailwind CSS v4 (`@theme` tokens), Prisma + SQLite, `node --test` via `tsx`, Docker Compose behind an existing Traefik.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/normalize.ts` | **Create.** Pure data shaping: types, validation helpers, `normalizeTenant`. No server-only, no Prisma, no `next/headers`. Unit-testable in plain Node. |
| `lib/tenant.ts` | **Modify.** Keeps only request-time concerns: `resolveRow`, `getTenant`, `baseDomain`, `isServableHost`. Re-exports everything from `lib/normalize.ts` so existing imports keep working. |
| `components/sections/Stats.tsx` | **Create.** KPI tile grid. |
| `components/sections/Findings.tsx` | **Create.** Ranked finding list. |
| `components/sections/Breakdown.tsx` | **Create.** Labelled horizontal bars. |
| `components/sections/Cta.tsx` | **Create.** Closing call-to-action band. |
| `app/page.tsx` | **Modify.** Four entries added to the section map. |
| `scripts/audit-shopify.ts` | **Create.** Dev-only measurement tool. Takes a store domain argument. Contains no business-specific values. |
| `tests/normalize.test.ts` | **Create.** The one runnable check over `normalizeTenant`. |
| `package.json` | **Modify.** Add `test` and `audit:shopify` scripts. |

Nothing in `prisma/`, `proxy.ts`, `lib/tokens.ts`, `app/layout.tsx` or `app/robots.ts` changes.

---

### Task 1: Extract pure normalisation into `lib/normalize.ts`

Behaviour-preserving refactor. No new features. This exists so Task 2 onward can be test-driven.

**Files:**
- Create: `lib/normalize.ts`
- Modify: `lib/tenant.ts`

- [ ] **Step 1: Create `lib/normalize.ts` by moving code out of `lib/tenant.ts`**

Move the following from `lib/tenant.ts` into a new `lib/normalize.ts`, **verbatim and in the same order**:

- the `Dir`, `SectionKey`, `Cta`, `ServiceItem`, `GalleryImage`, `HoursRow`, `Social`, `NormalizedTenant` type declarations
- the `DEFAULT_ORDER` and `SOCIAL_LABELS` constants
- the `str`, `asArray`, `obj`, `safeUrl`, `titleCase` functions
- the entire `normalizeTenant` function

Do **not** move: the `import "server-only"` line, the `cache`/`headers`/`prisma` imports, `LoadedTenant`, `resolveRow`, `getTenant`, `baseDomain`, `isServableHost`.

The new file must begin with exactly this — and nothing else above it:

```ts
// Pure, dependency-free shaping of a tenant's raw record into a fully-defaulted
// render shape. Deliberately free of server-only, Prisma and next/headers so it
// can be exercised directly by the test runner.

import type { RawTheme } from "./tokens";
```

Everything moved keeps its existing `export` keywords. `DEFAULT_ORDER`, `SOCIAL_LABELS`, `str`, `asArray`, `obj` and `titleCase` stay unexported; `safeUrl` and `normalizeTenant` stay exported.

- [ ] **Step 2: Replace the top of `lib/tenant.ts`**

`lib/tenant.ts` keeps only request-time concerns. Its imports and re-export become:

```ts
import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { prisma } from "./db";
import { normalizeTenant, type NormalizedTenant } from "./normalize";

// Types and the pure normaliser live in ./normalize; re-exported so existing
// imports (components, app/page.tsx) keep working unchanged.
export * from "./normalize";

export interface LoadedTenant {
  status: string;
  data: NormalizedTenant;
}
```

Everything below that — `resolveRow`, `getTenant`, `baseDomain`, `isServableHost` — stays exactly as it is.

- [ ] **Step 3: Verify the app still type-checks and builds**

Run: `npx tsc --noEmit`
Expected: no errors.

Run: `npm run build`
Expected: build completes, `✓ Compiled successfully`.

- [ ] **Step 4: Commit**

```bash
git add lib/normalize.ts lib/tenant.ts
git commit -m "refactor: split pure tenant normalisation out of request-time module"
```

---

### Task 2: Add the test harness and lock in existing behaviour

**Files:**
- Create: `tests/normalize.test.ts`
- Modify: `package.json`

- [ ] **Step 1: Add the test script to `package.json`**

In the `"scripts"` block, add:

```json
"test": "node --import tsx --test tests/normalize.test.ts",
```

- [ ] **Step 2: Write the failing test**

Create `tests/normalize.test.ts`:

```ts
import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeTenant } from "../lib/normalize";

test("an empty record still yields a composed page", () => {
  const t = normalizeTenant("acme-co", {});
  assert.equal(t.brand.name, "Acme Co");
  assert.equal(t.locale.dir, "ltr");
  assert.equal(t.hero.headline, "Acme Co");
  assert.equal(t.about, undefined);
  assert.equal(t.services, undefined);
});

test("malformed input never throws", () => {
  for (const bad of [null, undefined, 42, "str", [], { sections: 7 }]) {
    assert.doesNotThrow(() => normalizeTenant("x", bad));
  }
});

test("unsafe hrefs are dropped from hero ctas", () => {
  const t = normalizeTenant("x", {
    sections: {
      hero: {
        headline: "Hi",
        ctas: [
          { label: "bad", href: "javascript:alert(1)" },
          { label: "good", href: "https://example.com" },
        ],
      },
    },
  });
  assert.equal(t.hero.ctas.length, 1);
  assert.equal(t.hero.ctas[0].label, "good");
});
```

- [ ] **Step 3: Run the tests**

Run: `npm test`
Expected: 3 tests pass. If `normalizeTenant` cannot be imported, Task 1 was done wrong — `lib/normalize.ts` must not import `server-only`.

- [ ] **Step 4: Commit**

```bash
git add tests/normalize.test.ts package.json
git commit -m "test: cover tenant normalisation defaults and href safety"
```

---

### Task 3: Add the `stats` section type

**Files:**
- Modify: `lib/normalize.ts`
- Modify: `tests/normalize.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/normalize.test.ts`:

```ts
test("stats keeps valid items and drops incomplete ones", () => {
  const t = normalizeTenant("x", {
    sections: {
      stats: {
        title: "At a glance",
        items: [
          { label: "Unavailable", value: "82%", note: "of size options" },
          { label: "Brands", value: "50", emphasis: true },
          { label: "No value here" },
          { value: "no label" },
          "junk",
        ],
      },
    },
  });
  assert.equal(t.stats?.title, "At a glance");
  assert.equal(t.stats?.items.length, 2);
  assert.equal(t.stats?.items[0].note, "of size options");
  assert.equal(t.stats?.items[0].emphasis, false);
  assert.equal(t.stats?.items[1].emphasis, true);
});

test("stats vanishes when no item is complete", () => {
  const t = normalizeTenant("x", { sections: { stats: { items: [{ label: "x" }] } } });
  assert.equal(t.stats, undefined);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — `t.stats` is `undefined` / property `stats` does not exist on type.

- [ ] **Step 3: Implement**

In `lib/normalize.ts`, add the interface next to the other item interfaces:

```ts
export interface StatItem {
  label: string;
  value: string;
  note?: string;
  emphasis: boolean;
}
```

Add to the `NormalizedTenant` interface, after `hero`:

```ts
  stats?: { title?: string; items: StatItem[] };
```

Add `"stats"` to the `SectionKey` union and to `DEFAULT_ORDER` (place it directly after `"hero"`).

Inside `normalizeTenant`, after the `hero` block, add:

```ts
  // stats — only with at least one item carrying both a label and a value; a
  // tile without a value would render an empty frame.
  const statsObj = obj(sections.stats);
  const statItems = asArray(statsObj.items).flatMap<StatItem>((it) => {
    const o = obj(it);
    const label = str(o.label);
    const value = str(o.value);
    if (!label || !value) return [];
    return [{ label, value, note: str(o.note), emphasis: o.emphasis === true }];
  });
  const stats = statItems.length
    ? { title: str(statsObj.title), items: statItems }
    : undefined;
```

Add `stats,` to the returned object, after `hero,`.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/normalize.ts tests/normalize.test.ts
git commit -m "feat: add stats section type"
```

---

### Task 4: Add the `findings` section type

**Files:**
- Modify: `lib/normalize.ts`
- Modify: `tests/normalize.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/normalize.test.ts`:

```ts
test("findings keeps titled items and auto-numbers missing ranks", () => {
  const t = normalizeTenant("x", {
    sections: {
      findings: {
        title: "What we found",
        items: [
          { title: "First", detail: "Because.", action: "Do this" },
          { title: "Second", rank: "B" },
          { detail: "no title" },
        ],
      },
    },
  });
  assert.equal(t.findings?.items.length, 2);
  assert.equal(t.findings?.items[0].rank, "01");
  assert.equal(t.findings?.items[0].action, "Do this");
  assert.equal(t.findings?.items[1].rank, "B");
});

test("findings vanishes with no titled item", () => {
  const t = normalizeTenant("x", { sections: { findings: { items: [{ detail: "x" }] } } });
  assert.equal(t.findings, undefined);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — property `findings` does not exist.

- [ ] **Step 3: Implement**

In `lib/normalize.ts` add:

```ts
export interface FindingItem {
  rank: string;
  title: string;
  detail?: string;
  action?: string;
}
```

Add to `NormalizedTenant` after `stats`:

```ts
  findings?: { title?: string; items: FindingItem[] };
```

Add `"findings"` to `SectionKey` and to `DEFAULT_ORDER` (directly after `"stats"`).

Inside `normalizeTenant`, after the `stats` block:

```ts
  // findings — only with at least one titled item. `rank` is display order
  // only, never a severity scale, so it can never drive colour.
  const findingsObj = obj(sections.findings);
  const findingItems = asArray(findingsObj.items).flatMap<FindingItem>((it, i) => {
    const o = obj(it);
    const title = str(o.title);
    if (!title) return [];
    return [
      {
        rank: str(o.rank) ?? String(i + 1).padStart(2, "0"),
        title,
        detail: str(o.detail),
        action: str(o.action),
      },
    ];
  });
  const findings = findingItems.length
    ? { title: str(findingsObj.title), items: findingItems }
    : undefined;
```

Add `findings,` to the returned object.

> Note: the auto-number uses the index in the **source** array, so a dropped
> untitled item can leave a gap (e.g. `01`, `03`). That is intentional — it
> keeps numbering stable against the authored record.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/normalize.ts tests/normalize.test.ts
git commit -m "feat: add findings section type"
```

---

### Task 5: Add the `breakdown` section type

**Files:**
- Modify: `lib/normalize.ts`
- Modify: `tests/normalize.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/normalize.test.ts`:

```ts
test("breakdown keeps numeric rows and derives max", () => {
  const t = normalizeTenant("x", {
    sections: {
      breakdown: {
        title: "By size",
        note: "Measured 25 Jul",
        rows: [
          { label: "White / XL", value: 85 },
          { label: "Black / L", value: "74", caption: "62 of 84" },
          { label: "bad", value: "abc" },
          { label: "negative", value: -5 },
          { value: 10 },
        ],
      },
    },
  });
  assert.equal(t.breakdown?.rows.length, 2);
  assert.equal(t.breakdown?.max, 85);
  assert.equal(t.breakdown?.rows[1].value, 74);
  assert.equal(t.breakdown?.rows[1].caption, "62 of 84");
  assert.equal(t.breakdown?.note, "Measured 25 Jul");
});

test("breakdown honours an explicit max", () => {
  const t = normalizeTenant("x", {
    sections: { breakdown: { max: 100, rows: [{ label: "a", value: 50 }] } },
  });
  assert.equal(t.breakdown?.max, 100);
});

test("breakdown vanishes when every value is zero or unusable", () => {
  for (const rows of [[{ label: "a", value: 0 }], [{ label: "a", value: "x" }], []]) {
    const t = normalizeTenant("x", { sections: { breakdown: { rows } } });
    assert.equal(t.breakdown, undefined);
  }
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — property `breakdown` does not exist.

- [ ] **Step 3: Implement**

In `lib/normalize.ts` add the numeric helper next to `str`:

```ts
function num(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v.trim()) : NaN;
  return Number.isFinite(n) ? n : undefined;
}
```

Add:

```ts
export interface BreakdownRow {
  label: string;
  value: number;
  caption?: string;
}
```

Add to `NormalizedTenant` after `findings`:

```ts
  breakdown?: { title?: string; note?: string; max: number; rows: BreakdownRow[] };
```

Add `"breakdown"` to `SectionKey` and to `DEFAULT_ORDER` (directly after `"findings"`).

Inside `normalizeTenant`, after the `findings` block:

```ts
  // breakdown — bars need a positive scale. If nothing usable survives, the
  // section vanishes rather than drawing an empty axis.
  const breakdownObj = obj(sections.breakdown);
  const breakdownRows = asArray(breakdownObj.rows).flatMap<BreakdownRow>((r) => {
    const o = obj(r);
    const label = str(o.label);
    const value = num(o.value);
    if (!label || value === undefined || value < 0) return [];
    return [{ label, value, caption: str(o.caption) }];
  });
  const declaredMax = num(breakdownObj.max);
  const derivedMax = breakdownRows.reduce((m, r) => Math.max(m, r.value), 0);
  const breakdownMax =
    declaredMax !== undefined && declaredMax > 0 ? declaredMax : derivedMax;
  const breakdown =
    breakdownRows.length && breakdownMax > 0
      ? {
          title: str(breakdownObj.title),
          note: str(breakdownObj.note),
          max: breakdownMax,
          rows: breakdownRows,
        }
      : undefined;
```

Add `breakdown,` to the returned object.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/normalize.ts tests/normalize.test.ts
git commit -m "feat: add breakdown section type"
```

---

### Task 6: Add the `cta` section type

**Files:**
- Modify: `lib/normalize.ts`
- Modify: `tests/normalize.test.ts`

- [ ] **Step 1: Write the failing test**

Append to `tests/normalize.test.ts`:

```ts
test("cta keeps safe actions and drops unsafe ones", () => {
  const t = normalizeTenant("x", {
    sections: {
      cta: {
        title: "Want the rest?",
        body: "Reply and it's yours.",
        actions: [
          { label: "Reply", href: "https://instagram.com/example" },
          { label: "Bad", href: "javascript:alert(1)" },
          { label: "No href" },
        ],
      },
    },
  });
  assert.equal(t.cta?.actions.length, 1);
  assert.equal(t.cta?.actions[0].label, "Reply");
  assert.equal(t.cta?.title, "Want the rest?");
});

test("cta survives on copy alone but vanishes when wholly empty", () => {
  assert.ok(normalizeTenant("x", { sections: { cta: { body: "Just words" } } }).cta);
  assert.equal(normalizeTenant("x", { sections: { cta: { actions: [] } } }).cta, undefined);
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm test`
Expected: FAIL — property `cta` does not exist.

- [ ] **Step 3: Implement**

In `lib/normalize.ts` add to `NormalizedTenant` after `breakdown`:

```ts
  cta?: { title?: string; body?: string; actions: Cta[] };
```

`Cta` (`{ label, href }`) already exists and is reused — do not declare a second action type.

Add `"cta"` to `SectionKey` and to the **end** of `DEFAULT_ORDER`.

Inside `normalizeTenant`, after the `breakdown` block:

```ts
  // cta — the closing ask. Survives on copy alone; vanishes only when it has
  // neither words nor a usable action.
  const ctaObj = obj(sections.cta);
  const ctaTitle = str(ctaObj.title);
  const ctaBody = str(ctaObj.body);
  const ctaActions = asArray(ctaObj.actions)
    .flatMap<Cta>((a) => {
      const label = str(obj(a).label);
      const href = safeUrl(obj(a).href);
      return label && href ? [{ label, href }] : [];
    })
    .slice(0, 3);
  const cta =
    ctaTitle || ctaBody || ctaActions.length
      ? { title: ctaTitle, body: ctaBody, actions: ctaActions }
      : undefined;
```

Add `cta,` to the returned object.

- [ ] **Step 4: Run to verify it passes**

Run: `npm test`
Expected: all tests PASS (12 tests total).

- [ ] **Step 5: Commit**

```bash
git add lib/normalize.ts tests/normalize.test.ts
git commit -m "feat: add cta section type"
```

---

### Task 7: Build the four section components

**Files:**
- Create: `components/sections/Stats.tsx`
- Create: `components/sections/Findings.tsx`
- Create: `components/sections/Breakdown.tsx`
- Create: `components/sections/Cta.tsx`

All four follow the existing pattern: import `Section`/`SectionTitle`, accept a `NonNullable<NormalizedTenant[...]>` prop, render the title only when present, and use token classes (`text-fg`, `text-muted`, `border-line`, `bg-surface`, `bg-accent-soft`, `rounded-[var(--radius)]`). No hardcoded colours.

- [ ] **Step 1: Create `components/sections/Stats.tsx`**

```tsx
import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

// Headline figures. `emphasis` tints a value with the accent token so a record
// can mark a figure that reads as a strength; it carries no other meaning.
export function Stats({
  stats,
}: {
  stats: NonNullable<NormalizedTenant["stats"]>;
}) {
  return (
    <Section surface>
      {stats.title ? <SectionTitle>{stats.title}</SectionTitle> : null}
      <div
        className={`grid gap-px overflow-hidden rounded-[var(--radius)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4 ${
          stats.title ? "mt-10" : ""
        }`}
      >
        {stats.items.map((item, i) => (
          <div key={i} className="bg-canvas p-6">
            <div
              className={`font-heading text-[clamp(1.9rem,5vw,2.6rem)] font-bold leading-none ${
                item.emphasis ? "text-accent" : "text-fg"
              }`}
            >
              {item.value}
            </div>
            <div className="mt-3 text-sm font-medium text-fg">{item.label}</div>
            {item.note ? (
              <div className="mt-1 text-sm leading-relaxed text-muted">
                {item.note}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Section>
  );
}
```

- [ ] **Step 2: Create `components/sections/Findings.tsx`**

```tsx
import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

// Ranked observations. The rank is editorial order, never a severity scale, so
// it is rendered as a numeral in the accent token rather than a traffic light.
export function Findings({
  findings,
}: {
  findings: NonNullable<NormalizedTenant["findings"]>;
}) {
  return (
    <Section>
      {findings.title ? <SectionTitle>{findings.title}</SectionTitle> : null}
      <ol className={findings.title ? "mt-10" : ""}>
        {findings.items.map((item, i) => (
          <li
            key={i}
            className="flex gap-5 border-t border-line py-7 first:border-t-0 first:pt-0"
          >
            <span
              aria-hidden="true"
              className="shrink-0 pt-1 font-heading text-sm font-bold tabular-nums text-accent"
            >
              {item.rank}
            </span>
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-semibold text-fg">
                {item.title}
              </h3>
              {item.detail ? (
                <p className="mt-2 leading-relaxed text-muted">{item.detail}</p>
              ) : null}
              {item.action ? (
                <p className="mt-3 text-sm font-medium text-accent">
                  {item.action}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
```

- [ ] **Step 3: Create `components/sections/Breakdown.tsx`**

```tsx
import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

// Labelled bars. Every value is also stated as text, so the chart is never the
// only way to read the number.
export function Breakdown({
  breakdown,
}: {
  breakdown: NonNullable<NormalizedTenant["breakdown"]>;
}) {
  return (
    <Section surface>
      {breakdown.title ? <SectionTitle>{breakdown.title}</SectionTitle> : null}
      {breakdown.note ? (
        <p className="mt-3 text-sm text-muted">{breakdown.note}</p>
      ) : null}
      <dl
        className={`flex flex-col gap-4 ${
          breakdown.title || breakdown.note ? "mt-10" : ""
        }`}
      >
        {breakdown.rows.map((row, i) => {
          const pct = Math.min(100, Math.max(0, (row.value / breakdown.max) * 100));
          return (
            <div
              key={i}
              className="grid grid-cols-[5rem_1fr_auto] items-center gap-3 sm:grid-cols-[8rem_1fr_auto] sm:gap-4"
            >
              <dt className="truncate text-sm text-muted">{row.label}</dt>
              <div
                aria-hidden="true"
                className="h-2 overflow-hidden rounded-full bg-accent-soft"
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <dd className="text-end text-sm font-semibold tabular-nums text-fg">
                {row.value}
                {row.caption ? (
                  <span className="ms-2 font-normal text-muted">{row.caption}</span>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>
    </Section>
  );
}
```

- [ ] **Step 4: Create `components/sections/Cta.tsx`**

```tsx
import type { NormalizedTenant } from "@/lib/tenant";
import { Section } from "@/components/Section";

// The closing ask. The first action is the primary button; any others render as
// quieter links beside it.
export function Cta({ cta }: { cta: NonNullable<NormalizedTenant["cta"]> }) {
  return (
    <Section>
      <div className="rounded-[var(--radius)] border border-line p-8 sm:p-12">
        {cta.title ? (
          <h2 className="font-heading text-[clamp(1.4rem,3vw,2rem)] font-semibold text-fg">
            {cta.title}
          </h2>
        ) : null}
        {cta.body ? (
          <p className="mt-3 max-w-prose leading-relaxed text-muted">{cta.body}</p>
        ) : null}
        {cta.actions.length ? (
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {cta.actions.map((a, i) =>
              i === 0 ? (
                <a
                  key={i}
                  href={a.href}
                  className="inline-block rounded-full bg-primary px-7 py-3 font-semibold text-on-primary"
                >
                  {a.label}
                </a>
              ) : (
                <a
                  key={i}
                  href={a.href}
                  className="font-medium text-fg underline underline-offset-4"
                >
                  {a.label}
                </a>
              ),
            )}
          </div>
        ) : null}
      </div>
    </Section>
  );
}
```

- [ ] **Step 5: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add components/sections/Stats.tsx components/sections/Findings.tsx components/sections/Breakdown.tsx components/sections/Cta.tsx
git commit -m "feat: add stats, findings, breakdown and cta section components"
```

---

### Task 8: Wire the sections into the page

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Add the imports**

After the existing `Hero` import in `app/page.tsx`, add:

```tsx
import { Stats } from "@/components/sections/Stats";
import { Findings } from "@/components/sections/Findings";
import { Breakdown } from "@/components/sections/Breakdown";
import { Cta } from "@/components/sections/Cta";
```

- [ ] **Step 2: Add the four entries to the section map**

In the `sections` object, after the `hero` entry, add:

```tsx
    stats: d.stats ? <Stats stats={d.stats} /> : null,
    findings: d.findings ? <Findings findings={d.findings} /> : null,
    breakdown: d.breakdown ? <Breakdown breakdown={d.breakdown} /> : null,
```

and after the `contact` entry, add:

```tsx
    cta: d.cta ? <Cta cta={d.cta} /> : null,
```

The `Record<SectionKey, ReactNode>` annotation forces all four to be present — if one is missing the build fails, which is the intended safety net.

- [ ] **Step 3: Verify the build**

Run: `npm run build`
Expected: `✓ Compiled successfully`, no type errors.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "feat: render audit sections in the page section map"
```

---

### Task 9: Add the brand-free Shopify measurement tool

Dev-only. It never ships in a request path and contains no business-specific values — the store domain is an argument.

**Files:**
- Create: `scripts/audit-shopify.ts`
- Modify: `package.json`

- [ ] **Step 1: Create `scripts/audit-shopify.ts`**

```ts
// Measures a public Shopify catalogue and prints JSON to stdout.
//
//   npm run audit:shopify -- example-store.com
//
// A development tool for authoring tenant records. It is never called at
// request time and holds no business-specific values. Wording of findings is
// left to a human: only mechanical measurements are emitted.

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36";

interface Variant { available?: boolean; title?: string; price?: string }
interface Product {
  title?: string;
  vendor?: string;
  product_type?: string;
  body_html?: string;
  published_at?: string;
  variants?: Variant[];
  images?: unknown[];
}

async function fetchPage(domain: string, page: number): Promise<Product[]> {
  const res = await fetch(
    `https://${domain}/products.json?limit=50&page=${page}`,
    { headers: { "User-Agent": UA } },
  );
  if (!res.ok) throw new Error(`${domain} page ${page}: HTTP ${res.status}`);
  const body = (await res.json()) as { products?: Product[] };
  return body.products ?? [];
}

async function main() {
  const domain = (process.argv[2] ?? "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  if (!domain) {
    console.error("Usage: npm run audit:shopify -- <store-domain>");
    process.exit(1);
  }

  const products: Product[] = [];
  for (let page = 1; page <= 40; page++) {
    const batch = await fetchPage(domain, page);
    if (!batch.length) break;
    products.push(...batch);
  }

  let variants = 0;
  let available = 0;
  let fullyUnavailable = 0;
  let partlyUnavailable = 0;
  let noDescription = 0;
  let uncategorised = 0;
  const sizeTotal = new Map<string, number>();
  const sizeGone = new Map<string, number>();
  const vendors = new Set<string>();

  for (const p of products) {
    const vs = p.variants ?? [];
    const av = vs.filter((v) => v.available);
    variants += vs.length;
    available += av.length;
    if (vs.length && !av.length) fullyUnavailable++;
    else if (vs.length && av.length < vs.length) partlyUnavailable++;

    for (const v of vs) {
      const t = (v.title ?? "").trim();
      if (!t || t.toLowerCase() === "default title") continue;
      sizeTotal.set(t, (sizeTotal.get(t) ?? 0) + 1);
      if (!v.available) sizeGone.set(t, (sizeGone.get(t) ?? 0) + 1);
    }

    if ((p.body_html ?? "").trim().length < 40) noDescription++;
    if (!(p.product_type ?? "").trim()) uncategorised++;
    if (p.vendor) vendors.add(p.vendor);
  }

  const rows = [...sizeTotal.entries()]
    .filter(([, total]) => total >= 20)
    .map(([label, total]) => ({
      label,
      value: Math.round((100 * (sizeGone.get(label) ?? 0)) / total),
      caption: `${sizeGone.get(label) ?? 0} of ${total}`,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const pct = (n: number, d: number) => (d ? Math.round((100 * n) / d) : 0);

  console.log(
    JSON.stringify(
      {
        measuredOn: new Date().toISOString().slice(0, 10),
        measurements: {
          products: products.length,
          variants,
          available,
          unavailable: variants - available,
          unavailablePct: pct(variants - available, variants),
          fullyUnavailable,
          partlyUnavailable,
          noDescription,
          noDescriptionPct: pct(noDescription, products.length),
          uncategorised,
          uncategorisedPct: pct(uncategorised, products.length),
          vendors: vendors.size,
        },
        suggested: {
          breakdown: { rows },
        },
      },
      null,
      2,
    ),
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
```

- [ ] **Step 2: Add the script to `package.json`**

In `"scripts"`, add:

```json
"audit:shopify": "tsx scripts/audit-shopify.ts",
```

- [ ] **Step 3: Run it against a real store and confirm JSON**

Run: `npm run audit:shopify -- lokaleg.com`
Expected: JSON on stdout with `measurements.products` around 144 and `suggested.breakdown.rows` holding six size rows.

If this returns `HTTP 403`, the request was blocked upstream — run it from a residential network, not a datacentre IP. The tool is dev-only, so this does not affect the deployed app.

- [ ] **Step 4: Commit**

```bash
git add scripts/audit-shopify.ts package.json
git commit -m "feat: add brand-free shopify catalogue measurement tool"
```

---

### Task 10: Verify degradation and responsiveness locally

No tenant should be able to produce an empty frame, and the brochure path must be untouched.

**Files:** none modified.

- [ ] **Step 1: Confirm the brochure path is unaffected**

Run: `npm test`
Expected: all tests PASS — including the Task 2 tests proving a record with no audit sections still normalises exactly as before.

- [ ] **Step 2: Start the app against a scratch database**

```bash
DATABASE_URL="file:./dev.db" npx prisma migrate deploy
DATABASE_URL="file:./dev.db" npm run tenant:upsert -- ./examples/example.tenant.json
DATABASE_URL="file:./dev.db" npm run dev
```

- [ ] **Step 3: Check the brochure tenant still renders**

Open `http://example.localhost:3000`.
Expected: hero/about/services/gallery/hours/contact render as before; no stats, findings, breakdown or cta sections appear anywhere.

- [ ] **Step 4: Check widths**

At 320, 390, 768, 1280 and 1440 CSS pixels, confirm for every rendered section: no horizontal scrollbar on `<body>`, bar labels wrap or truncate without overlapping their values, and stat tiles reflow from one column to four.

- [ ] **Step 5: Commit any fixes**

```bash
git add -A
git commit -m "fix: responsive corrections for audit sections"
```

Skip this commit if no fixes were needed.

---

### Task 11: Author the first tenant's audit record

Data only. No source file mentions the business.

**Files:**
- Create: `deploy/tenant-record.json` (git-ignored working file; never committed with real business data)

- [ ] **Step 1: Confirm the record file is ignored**

Check `.gitignore` contains a line covering `deploy/tenant-record.json`. If not, append:

```
deploy/tenant-record.json
```

Commit that change:

```bash
git add .gitignore
git commit -m "chore: ignore local tenant record working file"
```

- [ ] **Step 2: Build the record**

Run `npm run audit:shopify -- lokaleg.com` and use its `measurements` and `suggested.breakdown.rows` to fill the record below. Figures must match the tool's output — do not carry numbers over by hand from an older run.

Write `deploy/tenant-record.json`:

```json
{
  "id": "lokal",
  "status": "published",
  "locale": { "lang": "en", "dir": "ltr" },
  "brand": {
    "name": "LOKAL",
    "tagline": "Bringing the LOKAL market to you with global standards."
  },
  "demo": {
    "note": "Independent review by GrindCTRL — not the official site of this business."
  },
  "theme": {
    "palette": {
      "primary": "#0c0d0b",
      "accent": "#7a9c00",
      "bg": "#f0f3ef",
      "text": "#0c0d0b"
    },
    "font": {
      "heading": "Space Grotesk",
      "body": "Inter",
      "url": "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
    },
    "radius": "10px"
  },
  "sections": {
    "order": ["hero", "stats", "findings", "breakdown", "cta"],
    "hero": {
      "headline": "144 products live. 548 of 3,019 size options can actually be bought.",
      "sub": "A review of your public catalogue, measured on 25 July 2026. The rest is demand already reaching your store that it cannot convert — here is where it is concentrated."
    },
    "stats": {
      "items": [
        { "label": "Size options not purchasable", "value": "82%", "note": "2,471 of 3,019 across the catalogue" },
        { "label": "Products with no description", "value": "92%", "note": "132 of 144 — nothing for search to rank" },
        { "label": "Products uncategorised", "value": "37%", "note": "54 of 144 are harder to browse to" },
        { "label": "Independent brands carried", "value": "50", "note": "141 releases in the last 90 days", "emphasis": true }
      ]
    },
    "findings": {
      "title": "What we found",
      "items": [
        {
          "title": "The sizes most people want are the ones that are gone",
          "detail": "White/XL is 85% unavailable and Black/L 74%. The shopper most likely to buy is the one most likely to hit a dead end.",
          "action": "Restock priority by size, plus back-in-stock capture on the sold-out ones"
        },
        {
          "title": "132 of 144 products carry no description",
          "detail": "Search engines have almost no text to rank, and a shopper cannot judge fit or fabric before committing.",
          "action": "Draft copy per product from your own photos and specs, for you to approve"
        },
        {
          "title": "40 products are fully unavailable but still browsable",
          "detail": "Every click into one spends a visitor's attention on something they cannot buy, and quietly costs trust.",
          "action": "Automatically demote sold-out products and surface what is in stock"
        },
        {
          "title": "54 products sit outside any category",
          "detail": "They exist, but browsing and filtering will not reliably lead anyone to them.",
          "action": "Backfill product types so every item is reachable by browse"
        }
      ]
    },
    "breakdown": {
      "title": "Unavailable, by size run",
      "note": "Share of each size that cannot currently be added to cart. Measured 25 July 2026 from public catalogue data.",
      "max": 100,
      "rows": [
        { "label": "White / XL", "value": 85, "caption": "34 of 40" },
        { "label": "Black / XL", "value": 81, "caption": "43 of 53" },
        { "label": "White / L", "value": 75, "caption": "46 of 61" },
        { "label": "Black / L", "value": 74, "caption": "62 of 84" },
        { "label": "White / M", "value": 70, "caption": "43 of 61" },
        { "label": "Black / M", "value": 61, "caption": "51 of 84" }
      ]
    },
    "cta": {
      "title": "We measured all of this from public data, in an afternoon.",
      "body": "The full breakdown — every product, every gap, and the order we would fix them in — is yours, no strings. Reply to the message this came from.",
      "actions": [
        { "label": "Reply on Instagram", "href": "https://www.instagram.com/lokalegypt/" },
        { "label": "See the store", "href": "https://lokaleg.com" }
      ]
    }
  }
}
```

Note the accent is `#7a9c00` — a darkened form of the brand's neon lime, because the original fails contrast as small text and as bar fill on a light canvas. The brand's own lime remains the visual reference without becoming unreadable.

- [ ] **Step 3: Re-validate the claims against an independent signal**

The spec forbids shipping a figure that has not been cross-checked, because this
page asserts facts about a real third party. If Step 2 produced numbers that
differ from the ones written into the record, re-run this check before going
further.

For eight products the catalogue endpoint reports as unavailable, fetch the
product page and confirm its embedded schema.org markup agrees:

```bash
curl -s "https://lokaleg.com/products/<handle>" | grep -o '"availability"[^,]*'
```

Expected: `OutOfStock` for products the catalogue reports as fully unavailable,
and both `InStock` and `OutOfStock` present for partially available ones.

If any product disagrees, do not publish the percentage. Soften the wording to
only what is directly observable, or drop the claim.

- [ ] **Step 4: Verify the record renders locally**

```bash
DATABASE_URL="file:./dev.db" npm run tenant:upsert -- ./deploy/tenant-record.json
DATABASE_URL="file:./dev.db" npm run dev
```

Open `http://lokal.localhost:3000`.
Expected: hero, four stat tiles, four findings, six bars, and the closing band — in that order, with the demonstration mark fixed at the bottom.

- [ ] **Step 5: Re-check the widths that matter**

At 320, 390 and 430 CSS pixels confirm no horizontal overflow and that the long hero headline wraps cleanly.

---

### Task 12: Deploy and verify live

Code changed, so this needs a rebuild — unlike a pure record change.

**Files:** none modified.

- [ ] **Step 1: Push the branch**

```bash
git push origin claude/multi-tenant-demo-dashboard-fh8bt8
```

- [ ] **Step 2: Update and rebuild on the server**

On the VPS (`/opt/fordemos`):

```bash
git pull
cd deploy && docker compose -f compose.traefik.yml up -d --build
```

Expected: the `grindctrl-demos-app-1` container is recreated and reports `Ready`.

- [ ] **Step 3: Load the record**

```bash
docker compose -f compose.traefik.yml cp ./tenant-record.json app:/tmp/rec.json
docker compose -f compose.traefik.yml exec -T app npm run tenant:upsert -- /tmp/rec.json
```

Expected: `✓ lokal (published)`.

- [ ] **Step 4: Verify from the public internet**

```bash
curl -s -o /dev/null -D - https://lokal.grindctrl.cloud | grep -iE "HTTP/|x-robots"
curl -s https://lokal.grindctrl.cloud | grep -coE "82%|92%|What we found|Reply on Instagram"
```

Expected: `HTTP/1.1 200 OK`, `X-Robots-Tag: noindex, nofollow`, and a non-zero match count.

- [ ] **Step 5: Confirm the kill switch still works**

```bash
docker compose -f compose.traefik.yml exec -T app npm run tenant:offline -- lokal
curl -s -o /dev/null -w "%{http_code}\n" https://lokal.grindctrl.cloud
docker compose -f compose.traefik.yml exec -T app npm run tenant:online -- lokal
curl -s -o /dev/null -w "%{http_code}\n" https://lokal.grindctrl.cloud
```

Expected: `404` then `200`.

- [ ] **Step 6: Confirm no sibling service regressed**

```bash
for h in grindctrl.cloud wifi.grindctrl.cloud notify.grindctrl.cloud mcp.grindctrl.cloud; do
  curl -s -o /dev/null -w "$h=%{http_code}\n" https://$h
done
```

Expected: the same codes as before the deploy (`200`, `200`, `307`, and `mcp` unchanged). Anything newly failing means the router labels collided — roll back with `docker compose -f compose.traefik.yml down` and investigate before retrying.

---

## Verifying the multi-tenancy claim

Adding a second business must still cost one record and nothing else. To prove it after this work lands, author a record whose `order` omits every audit section — for example `["hero", "about", "services", "contact"]` — upsert it under a new `id`, and confirm it renders as a brochure at `<id>.grindctrl.cloud` with no stats, findings, breakdown or cta present, and no file, route or build changed.

The one caveat recorded during deployment still applies: because `*.grindctrl.cloud` is a shared subdomain space on this host, a **new subdomain** also needs its hostname appended to the Traefik router rule in `deploy/compose.traefik.yml` (one label, `docker compose up -d`, no rebuild). Moving demos to a dedicated wildcard would remove even that step.
