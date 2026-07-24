import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { prisma } from "./db";
import type { RawTheme } from "./tokens";

// The tenant is resolved from the requested hostname at request time, its record
// is loaded, and normalizeTenant() turns whatever it contains — often very
// little — into a fully-defaulted shape where each section is present ONLY if it
// has the minimal data to render. Absent sections are `undefined` and simply
// never appear. Nothing here can throw on malformed input.

export type Dir = "ltr" | "rtl";
export type SectionKey =
  | "hero"
  | "about"
  | "services"
  | "gallery"
  | "hours"
  | "contact";

export interface Cta {
  label: string;
  href: string;
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
  hero: { headline: string; sub?: string; image?: string; ctas: Cta[] };
  about?: { title?: string; body: string };
  services?: { title?: string; items: ServiceItem[] };
  gallery?: { title?: string; images: GalleryImage[] };
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

export interface LoadedTenant {
  status: string;
  data: NormalizedTenant;
}

const DEFAULT_ORDER: SectionKey[] = [
  "hero",
  "about",
  "services",
  "gallery",
  "hours",
  "contact",
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
    ctas: asArray(heroObj.ctas)
      .flatMap((c) => {
        const label = str(obj(c).label);
        const href = safeUrl(obj(c).href);
        return label && href ? [{ label, href }] : [];
      })
      .slice(0, 3),
  };

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
    ? { title: str(galleryObj.title), images: galleryImages }
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
    const label = str(obj(x).label) ?? SOCIAL_LABELS[type] ?? titleCase(type);
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
    about,
    services,
    gallery,
    hours,
    contact,
  };
}

// ---- request-time resolution ------------------------------------------------

const resolveRow = cache(
  async (subdomain: string | null, host: string | null) => {
    if (subdomain) {
      const row = await prisma.tenant.findUnique({ where: { subdomain } });
      if (row) return row;
    }
    if (host) {
      // Rare path: a tenant reachable by an explicit custom hostname.
      const rows = await prisma.tenant.findMany({
        where: { NOT: { hostnames: "[]" } },
      });
      for (const r of rows) {
        try {
          const hs = JSON.parse(r.hostnames);
          if (Array.isArray(hs) && hs.includes(host)) return r;
        } catch {
          /* ignore malformed hostnames */
        }
      }
    }
    return null;
  },
);

/** Resolve the tenant for the current request (deduped per request). */
export const getTenant = cache(async (): Promise<LoadedTenant | null> => {
  const h = await headers();
  const subdomain = h.get("x-tenant") || null;
  const host = h.get("x-host") || null;
  const row = await resolveRow(subdomain, host);
  if (!row) return null;
  let parsed: unknown = {};
  try {
    parsed = JSON.parse(row.config);
  } catch {
    /* malformed config still renders as an empty-but-composed page */
  }
  return { status: row.status, data: normalizeTenant(row.subdomain, parsed) };
});

/** Base domain the platform serves subdomains under. */
export function baseDomain(): string {
  return (process.env.BASE_DOMAIN ?? "grindctrl.cloud").toLowerCase();
}

/**
 * Whether a hostname should be served a certificate / page. Used by the Caddy
 * on-demand-TLS `ask` endpoint so certificates are only ever minted for the
 * apex or a known, published tenant.
 */
export async function isServableHost(hostRaw: string): Promise<boolean> {
  const host = hostRaw.trim().toLowerCase().split(":")[0];
  if (!host) return false;
  const base = baseDomain();
  if (host === base) return true; // apex: neutral platform page
  let subdomain: string | null = null;
  if (host.endsWith("." + base)) {
    subdomain = host.slice(0, -(base.length + 1)).split(".")[0];
    if (subdomain === "www") subdomain = null;
  }
  const row = await resolveRow(subdomain, host);
  return !!row && row.status === "published";
}
