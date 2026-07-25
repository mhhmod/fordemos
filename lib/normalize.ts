// Pure, dependency-free shaping of a tenant's raw record into a fully-defaulted
// render shape. Deliberately free of server-only, Prisma and next/headers so it
// can be exercised directly by the test runner.

import type { RawTheme } from "./tokens";

// The tenant is resolved from the requested hostname at request time, its record
// is loaded, and normalizeTenant() turns whatever it contains — often very
// little — into a fully-defaulted shape where each section is present ONLY if it
// has the minimal data to render. Absent sections are `undefined` and simply
// never appear. Nothing here can throw on malformed input.

export type Dir = "ltr" | "rtl";
export type SectionKey =
  | "hero"
  | "stats"
  | "findings"
  | "breakdown"
  | "compare"
  | "about"
  | "services"
  | "gallery"
  | "hours"
  | "contact"
  | "signature"
  | "cta";

export interface ComparePanel {
  label: string;
  title?: string;
  body?: string;
  image?: string;
}

export interface Cta {
  label: string;
  href: string;
}
export interface StatItem {
  label: string;
  value: string;
  note?: string;
  emphasis: boolean;
}
export interface FindingItem {
  rank: string;
  title: string;
  detail?: string;
  action?: string;
  image?: string;
}

/** One of a fixed set, or the given fallback. Variants are structure, so an
 *  unknown value must never reach a component. */
function oneOf<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  const v2 = str(v);
  return (allowed as readonly string[]).includes(v2 ?? "") ? (v2 as T) : fallback;
}
export interface BreakdownRow {
  label: string;
  value: number;
  caption?: string;
}
export interface ServiceItem {
  name: string;
  desc?: string;
  price?: string;
}
export interface GalleryImage {
  src: string;
  alt: string;
}
export interface HoursRow {
  label: string;
  value: string;
}
export interface Social {
  type: string;
  href: string;
  label: string;
}

export interface NormalizedTenant {
  subdomain: string;
  locale: { lang: string; dir: Dir };
  brand: {
    name: string;
    tagline?: string;
    logo?: { src: string; alt: string };
  };
  theme: RawTheme;
  demoNote?: string;
  order: SectionKey[];
  hero: {
    headline: string;
    sub?: string;
    image?: string;
    variant: "banner" | "split" | "stack";
    ctas: Cta[];
  };
  stats?: { title?: string; variant: "tiles" | "band"; items: StatItem[] };
  findings?: { title?: string; items: FindingItem[] };
  breakdown?: {
    title?: string;
    note?: string;
    unit?: string;
    max: number;
    rows: BreakdownRow[];
  };
  compare?: {
    title?: string;
    note?: string;
    before: ComparePanel;
    after: ComparePanel;
  };
  signature?: {
    title?: string;
    name: string;
    role?: string;
    note?: string;
    avatar?: string;
    proof: string[];
  };
  cta?: { title?: string; body?: string; actions: Cta[] };
  about?: { title?: string; body: string };
  services?: { title?: string; items: ServiceItem[] };
  gallery?: {
    title?: string;
    variant: "grid" | "mosaic" | "strip";
    images: GalleryImage[];
  };
  hours?: { title?: string; rows: HoursRow[] };
  contact?: {
    title?: string;
    phone?: string;
    email?: string;
    address?: string;
    map?: string;
    socials: Social[];
  };
}

const DEFAULT_ORDER: SectionKey[] = [
  "hero",
  "stats",
  "findings",
  "breakdown",
  "compare",
  "about",
  "services",
  "gallery",
  "hours",
  "contact",
  "signature",
  "cta",
];

const SOCIAL_LABELS: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  tiktok: "TikTok",
  x: "X",
  twitter: "X",
  youtube: "YouTube",
  linkedin: "LinkedIn",
  snapchat: "Snapchat",
  telegram: "Telegram",
  website: "Website",
  web: "Website",
};

function str(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function num(v: unknown): number | undefined {
  if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return undefined;
  const n = Number(s);
  return Number.isFinite(n) ? n : undefined;
}

/** Shared cap for label+href action lists (hero ctas, cta actions). */
function ctaList(v: unknown): Cta[] {
  return asArray(v)
    .flatMap<Cta>((c) => {
      const label = str(obj(c).label);
      const href = safeUrl(obj(c).href);
      return label && href ? [{ label, href }] : [];
    })
    .slice(0, 3);
}

function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}

function obj(v: unknown): Record<string, unknown> {
  return v && typeof v === "object" ? (v as Record<string, unknown>) : {};
}

/** Only allow hrefs/srcs we're willing to emit. Blocks javascript:, data:, etc. */
export function safeUrl(v: unknown): string | undefined {
  const s = str(v);
  if (!s) return undefined;
  if (s.startsWith("/") && !s.startsWith("//")) return s; // root-relative
  // Same-page anchor, so a record can link to its own sections.
  if (/^#[\w-]+$/.test(s)) return s;
  try {
    const u = new URL(s);
    if (["http:", "https:", "mailto:", "tel:"].includes(u.protocol)) return s;
  } catch {
    /* not a URL */
  }
  return undefined;
}

function titleCase(s: string): string {
  return s
    .replace(/[-_]+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeTenant(
  subdomain: string,
  raw: unknown,
): NormalizedTenant {
  const root = obj(raw);
  const sections = obj(root.sections);

  // locale
  const localeObj = obj(root.locale);
  const lang = (str(localeObj.lang) ?? "en").replace(/[^a-zA-Z-]/g, "").slice(0, 12) || "en";
  const dir: Dir = str(localeObj.dir) === "rtl" ? "rtl" : "ltr";

  // brand — name always resolves to something real (never a placeholder).
  const brandObj = obj(root.brand);
  const name = str(brandObj.name) ?? titleCase(subdomain);
  const tagline = str(brandObj.tagline);
  const logoObj = obj(brandObj.logo);
  const logoSrc = safeUrl(logoObj.src);
  const logo = logoSrc
    ? { src: logoSrc, alt: str(logoObj.alt) ?? name }
    : undefined;

  // theme is validated downstream by buildTheme(); pass through as-is.
  const theme = obj(root.theme) as RawTheme;

  // section order (filtered to known keys, de-duped, default when empty)
  const requested = asArray(sections.order)
    .map(str)
    .filter((k): k is string => !!k) as string[];
  const seen = new Set<SectionKey>();
  const order = (requested.length ? requested : DEFAULT_ORDER)
    .filter((k): k is SectionKey => DEFAULT_ORDER.includes(k as SectionKey))
    .filter((k) => (seen.has(k) ? false : (seen.add(k), true)));

  // hero — always present; degrades to the brand name as headline.
  const heroObj = obj(sections.hero);
  const hero = {
    headline: str(heroObj.headline) ?? tagline ?? name,
    sub: str(heroObj.sub),
    image: safeUrl(heroObj.image),
    variant: oneOf(
      heroObj.variant,
      ["banner", "split", "stack"] as const,
      safeUrl(heroObj.image) ? "banner" : "stack",
    ),
    ctas: ctaList(heroObj.ctas),
  };

  // stats — only with at least one item carrying both a label and a value; a
  // tile without a value would render an empty frame.
  const statsObj = obj(sections.stats);
  const statItems = asArray(statsObj.items).flatMap<StatItem>((it) => {
    const o = obj(it);
    const label = str(o.label);
    const value = str(o.value) ?? num(o.value)?.toString();
    if (!label || !value) return [];
    return [{ label, value, note: str(o.note), emphasis: o.emphasis === true }];
  });
  const stats = statItems.length
    ? {
        title: str(statsObj.title),
        variant: oneOf(statsObj.variant, ["tiles", "band"] as const, "tiles"),
        items: statItems,
      }
    : undefined;

  // findings — only with at least one titled item. `rank` is display order
  // only, never a severity scale, so it can never drive colour.
  const findingsObj = obj(sections.findings);
  const findingItems = asArray(findingsObj.items).flatMap<FindingItem>((it, i) => {
    const o = obj(it);
    const title = str(o.title);
    if (!title) return [];
    return [
      {
        image: safeUrl(o.image),
        rank:
          str(o.rank) ??
          num(o.rank)?.toString().padStart(2, "0") ??
          String(i + 1).padStart(2, "0"),
        title,
        detail: str(o.detail),
        action: str(o.action),
      },
    ];
  });
  const findings = findingItems.length
    ? { title: str(findingsObj.title), items: findingItems }
    : undefined;

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
  const breakdownMax = Math.max(declaredMax ?? 0, derivedMax);
  const breakdown =
    breakdownRows.length && derivedMax > 0
      ? {
          title: str(breakdownObj.title),
          note: str(breakdownObj.note),
          unit: str(breakdownObj.unit),
          max: breakdownMax,
          rows: breakdownRows,
        }
      : undefined;

  // compare — a before/after pair. Both panels must carry a label, otherwise
  // there is no comparison to draw and the section vanishes.
  const compareObj = obj(sections.compare);
  function panel(v: unknown): ComparePanel | undefined {
    const o = obj(v);
    const label = str(o.label);
    if (!label) return undefined;
    return {
      label,
      title: str(o.title),
      body: str(o.body),
      image: safeUrl(o.image),
    };
  }
  const beforePanel = panel(compareObj.before);
  const afterPanel = panel(compareObj.after);
  const compare =
    beforePanel && afterPanel
      ? {
          title: str(compareObj.title),
          note: str(compareObj.note),
          before: beforePanel,
          after: afterPanel,
        }
      : undefined;

  // signature — who is speaking. Needs a name; an unsigned block would be
  // worse than none at all.
  const signatureObj = obj(sections.signature);
  const signerName = str(signatureObj.name);
  const signature = signerName
    ? {
        title: str(signatureObj.title),
        name: signerName,
        role: str(signatureObj.role),
        note: str(signatureObj.note),
        avatar: safeUrl(signatureObj.avatar),
        proof: asArray(signatureObj.proof)
          .flatMap((x) => {
            const t = str(x);
            return t ? [t] : [];
          })
          .slice(0, 4),
      }
    : undefined;

  // cta — the closing ask. Survives on copy alone; vanishes only when it has
  // neither words nor a usable action.
  const ctaObj = obj(sections.cta);
  const ctaTitle = str(ctaObj.title);
  const ctaBody = str(ctaObj.body);
  const ctaActions = ctaList(ctaObj.actions);
  const cta =
    ctaBody || ctaActions.length
      ? { title: ctaTitle, body: ctaBody, actions: ctaActions }
      : undefined;

  // about — only with body copy
  const aboutObj = obj(sections.about);
  const aboutBody = str(aboutObj.body);
  const about = aboutBody
    ? { title: str(aboutObj.title), body: aboutBody }
    : undefined;

  // services — only with at least one named item
  const servicesObj = obj(sections.services);
  const serviceItems = asArray(servicesObj.items).flatMap<ServiceItem>((it) => {
    const iname = str(obj(it).name);
    if (!iname) return [];
    return [{ name: iname, desc: str(obj(it).desc), price: str(obj(it).price) }];
  });
  const services = serviceItems.length
    ? { title: str(servicesObj.title), items: serviceItems }
    : undefined;

  // gallery — only with at least one valid image
  const galleryObj = obj(sections.gallery);
  const galleryImages = asArray(galleryObj.images).flatMap<GalleryImage>((im) => {
    const src = safeUrl(obj(im).src);
    if (!src) return [];
    return [{ src, alt: str(obj(im).alt) ?? "" }];
  });
  const gallery = galleryImages.length
    ? {
        title: str(galleryObj.title),
        variant: oneOf(
          galleryObj.variant,
          ["grid", "mosaic", "strip"] as const,
          "grid",
        ),
        images: galleryImages,
      }
    : undefined;

  // hours — only with at least one complete row
  const hoursObj = obj(sections.hours);
  const hoursRows = asArray(hoursObj.rows).flatMap<HoursRow>((r) => {
    const label = str(obj(r).label);
    const value = str(obj(r).value);
    return label && value ? [{ label, value }] : [];
  });
  const hours = hoursRows.length
    ? { title: str(hoursObj.title), rows: hoursRows }
    : undefined;

  // contact — only if it carries at least one reachable detail
  const contactObj = obj(sections.contact);
  const phone = str(contactObj.phone);
  const email = str(contactObj.email);
  const address = str(contactObj.address);
  const map = safeUrl(contactObj.map);
  const socials = asArray(contactObj.socials).flatMap<Social>((x) => {
    const href = safeUrl(obj(x).href);
    if (!href) return [];
    const type = (str(obj(x).type) ?? "website").toLowerCase();
    const label = str(obj(x).label) ?? str(SOCIAL_LABELS[type]) ?? titleCase(type);
    return [{ type, href, label }];
  });
  const contact =
    phone || email || address || socials.length
      ? { title: str(contactObj.title), phone, email, address, map, socials }
      : undefined;

  return {
    subdomain,
    locale: { lang, dir },
    brand: { name, tagline, logo },
    theme,
    demoNote: str(obj(root.demo).note),
    order,
    hero,
    stats,
    findings,
    breakdown,
    compare,
    signature,
    about,
    services,
    gallery,
    hours,
    contact,
    cta,
  };
}
