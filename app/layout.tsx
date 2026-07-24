import "./globals.css";
import type { CSSProperties, ReactNode } from "react";
import type { Metadata, Viewport } from "next";
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
  return {
    title: published ? t!.data.brand.name : "Preview",
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
  const theme = published
    ? buildTheme(t!.data.theme)
    : { vars: {}, fontUrl: undefined };

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
