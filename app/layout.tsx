import "./globals.css";
import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import { getTenant } from "@/lib/tenant";
import { buildTheme } from "@/lib/tokens";
import { DemoMark } from "@/components/DemoMark";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

// A demonstration surface must never be indexed, whatever the tenant.
export async function generateMetadata(): Promise<Metadata> {
  const t = await getTenant();
  const published = !!t && t.status === "published";
  const title = published ? t!.data.brand.name : "Preview";

  // A link is judged in the message thread before it is opened, so the card
  // gets the tenant's own words. The accompanying image is generated in
  // app/opengraph-image.tsx from the same record.
  const description = published
    ? (t!.data.hero.sub ?? t!.data.brand.tagline)
    : undefined;

  // Absolute URLs for the card require an origin; take it from the host that
  // was actually requested so every tenant resolves its own.
  const h = await headers();
  const host = h.get("x-host") || h.get("host") || "";

  return {
    ...(host ? { metadataBase: new URL(`https://${host}`) } : {}),
    title,
    description,
    openGraph: { title, description, type: "website" },
    robots: { index: false, follow: false, nocache: true },
  };
}

export default async function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  const t = await getTenant();
  const published = !!t && t.status === "published";

  const locale = published ? t!.data.locale : { lang: "en", dir: "ltr" as const };
  // Unpublished still gets the neutral preset rather than an empty object, so
  // the skeleton variables are always defined.
  const theme = buildTheme(published ? t!.data.theme : undefined);

  return (
    <html
      lang={locale.lang}
      dir={locale.dir}
      style={theme.vars as CSSProperties}
    >
      <body>
        {theme.fontUrl ? (
          <link rel="stylesheet" href={theme.fontUrl} />
        ) : null}
        {children}
        {published ? (
          <DemoMark
            name={t!.data.brand.name}
            note={t!.data.demoNote}
            dir={locale.dir}
          />
        ) : null}
      </body>
    </html>
  );
}
