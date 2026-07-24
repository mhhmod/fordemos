// Turns a tenant's (possibly tiny) theme record into the CSS custom properties
// that drive the whole page. Provided values win; everything else is derived so
// that even a single brand colour yields a complete, accessible palette. These
// values are emitted as an inline style on the document element at request time.

import { isValidHex, isDark, onColor } from "./color";

export interface RawTheme {
  palette?: {
    primary?: string;
    bg?: string;
    text?: string;
    accent?: string;
    surface?: string;
    border?: string;
    onPrimary?: string;
    muted?: string;
  };
  font?: { heading?: string; body?: string; url?: string };
  radius?: string | number;
}

const SANS_FALLBACK =
  'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", "Noto Kufi Arabic", "Noto Naskh Arabic", "Geeza Pro", "Tahoma", sans-serif';

function cleanFamily(name?: string): string | undefined {
  if (!name) return undefined;
  // Font family names only: letters, numbers, spaces, hyphen/underscore.
  const s = name.replace(/[^\p{L}\p{N} _-]/gu, "").trim();
  return s.length ? s : undefined;
}

function cleanRadius(r?: string | number): string | undefined {
  if (r === undefined || r === null) return undefined;
  const s = String(r).trim();
  if (/^\d+(\.\d+)?$/.test(s)) return `${s}px`;
  if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(s)) return s;
  return undefined;
}

function safeFontUrl(u?: string): string | undefined {
  if (!u) return undefined;
  try {
    const url = new URL(u);
    return url.protocol === "https:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export interface ThemeResult {
  vars: Record<string, string>;
  fontUrl?: string;
}

export function buildTheme(theme: RawTheme | undefined): ThemeResult {
  const p = theme?.palette ?? {};

  const base = isValidHex(p.bg) ? p.bg : "#ffffff";
  const dark = isDark(base);
  const fg = isValidHex(p.text) ? p.text : dark ? "#f4f4f5" : "#17171b";
  const primary = isValidHex(p.primary) ? p.primary : fg;
  const accent = isValidHex(p.accent) ? p.accent : primary;
  const onPrimary = isValidHex(p.onPrimary) ? p.onPrimary : onColor(primary);
  const surface = isValidHex(p.surface)
    ? p.surface
    : `color-mix(in oklab, ${base} 94%, ${fg})`;
  const line = isValidHex(p.border)
    ? p.border
    : `color-mix(in oklab, ${base} 86%, ${fg})`;
  const muted = isValidHex(p.muted)
    ? p.muted
    : `color-mix(in oklab, ${fg} 58%, ${base})`;
  const accentSoft = `color-mix(in oklab, ${accent} 12%, ${base})`;

  const vars: Record<string, string> = {
    "--color-canvas": base,
    "--color-surface": surface,
    "--color-fg": fg,
    "--color-muted": muted,
    "--color-line": line,
    "--color-primary": primary,
    "--color-on-primary": onPrimary,
    "--color-accent": accent,
    "--color-accent-soft": accentSoft,
  };

  const heading = cleanFamily(theme?.font?.heading);
  const body = cleanFamily(theme?.font?.body);
  if (heading) vars["--font-heading"] = `"${heading}", ${SANS_FALLBACK}`;
  if (body) vars["--font-body"] = `"${body}", ${SANS_FALLBACK}`;

  const radius = cleanRadius(theme?.radius);
  if (radius) vars["--radius"] = radius;

  return { vars, fontUrl: safeFontUrl(theme?.font?.url) };
}
