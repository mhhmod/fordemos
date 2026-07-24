import { ImageResponse } from "next/og";
import { getTenant } from "@/lib/tenant";

// A per-tenant favicon, drawn from the record. Without one the browser tab and
// the share card fall back to a blank page glyph, which reads as unfinished.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const pick = (v: unknown, fallback: string) =>
  typeof v === "string" && HEX.test(v.trim()) ? v.trim() : fallback;

export default async function Icon() {
  const t = await getTenant();
  const d = t?.status === "published" ? t.data : undefined;

  const palette = (d?.theme?.palette ?? {}) as Record<string, unknown>;
  const bg = pick(palette.bg, "#0d0d0f");
  const accent = pick(palette.accent, pick(palette.primary, "#f5f5f4"));
  const initial = (d?.brand.name ?? "?").trim().charAt(0).toUpperCase();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: bg,
          color: accent,
          fontSize: 42,
          fontWeight: 700,
          fontFamily: "sans-serif",
        }}
      >
        {initial}
      </div>
    ),
    size,
  );
}
