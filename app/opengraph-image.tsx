import { ImageResponse } from "next/og";
import { getTenant } from "@/lib/tenant";

// The share card. A link pasted into a message is judged before it is opened,
// so this renders the tenant's single strongest figure straight from its record
// — no per-tenant asset to design, and the twentieth brand gets one for free.
//
// Drawn from the raw palette rather than the built tokens: the token layer
// emits color-mix(), which the image renderer cannot parse.

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const alt = "Preview";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const HEX = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;
const pick = (v: unknown, fallback: string) =>
  typeof v === "string" && HEX.test(v.trim()) ? v.trim() : fallback;

export default async function OpengraphImage() {
  const t = await getTenant();
  const d = t?.status === "published" ? t.data : undefined;

  const palette = (d?.theme?.palette ?? {}) as Record<string, unknown>;
  const bg = pick(palette.bg, "#0d0d0f");
  const fg = pick(palette.text, "#f5f5f4");
  const accent = pick(palette.accent, pick(palette.primary, "#f5f5f4"));

  const name = d?.brand.name ?? "Preview";
  const lead = d?.stats?.items[0];
  const headline = lead?.value ?? d?.brand.tagline ?? "";
  const caption = lead?.label ?? d?.hero.headline ?? "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          backgroundColor: bg,
          color: fg,
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 34, letterSpacing: 6 }}>
          {name.toUpperCase()}
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {headline ? (
            <div
              style={{
                display: "flex",
                fontSize: headline.length > 12 ? 96 : 168,
                fontWeight: 700,
                color: accent,
                lineHeight: 1,
              }}
            >
              {headline}
            </div>
          ) : null}
          {caption ? (
            <div
              style={{
                display: "flex",
                fontSize: 42,
                marginTop: 24,
                opacity: 0.85,
                maxWidth: 900,
              }}
            >
              {caption}
            </div>
          ) : null}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: 24,
            opacity: 0.6,
          }}
        >
          <div
            style={{
              display: "flex",
              width: 14,
              height: 14,
              backgroundColor: accent,
              marginRight: 16,
            }}
          />
          Demonstration — not the official site
        </div>
      </div>
    ),
    size,
  );
}
