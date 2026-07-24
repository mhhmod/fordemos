// Small, dependency-free colour maths. Its only job is to let a tenant that
// supplies a single colour still render as a coherent, accessible palette:
// we derive an accessible text-on-colour and decide light/dark intent here,
// and lean on CSS color-mix() (in tokens.ts) for tints.

export interface RGB {
  r: number;
  g: number;
  b: number;
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Parse `#rgb` / `#rrggbb`. Returns null for anything we don't understand. */
export function parseHex(input: string | undefined | null): RGB | null {
  if (!input) return null;
  const s = input.trim();
  if (!HEX.test(s)) return null;
  const hex = s.slice(1);
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/** Is this a valid colour string we can safely emit into CSS? */
export function isValidHex(input: string | undefined | null): input is string {
  return parseHex(input) !== null;
}

function channel(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
}

/** WCAG relative luminance (0 = black, 1 = white). */
export function luminance(rgb: RGB): number {
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function contrastRatio(a: RGB, b: RGB): number {
  const la = luminance(a);
  const lb = luminance(b);
  const lighter = Math.max(la, lb);
  const darker = Math.min(la, lb);
  return (lighter + 0.05) / (darker + 0.05);
}

/** True when a colour reads as "dark" (so foreground should be light). */
export function isDark(input: string, fallback = false): boolean {
  const rgb = parseHex(input);
  if (!rgb) return fallback;
  return luminance(rgb) < 0.5;
}

const NEAR_WHITE: RGB = { r: 255, g: 255, b: 255 };
const NEAR_BLACK: RGB = { r: 17, g: 17, b: 20 };

/**
 * Pick the most legible text colour to sit on top of `background`.
 * Returns a hex string. Defaults to white when the input is unparseable
 * (safer against an unknown-but-vivid brand colour).
 */
export function onColor(background: string): string {
  const bg = parseHex(background);
  if (!bg) return "#ffffff";
  const onWhite = contrastRatio(bg, NEAR_WHITE);
  const onBlack = contrastRatio(bg, NEAR_BLACK);
  return onWhite >= onBlack ? "#ffffff" : "#111114";
}
