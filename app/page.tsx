import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getTenant, type SectionKey } from "@/lib/tenant";
import { Header } from "@/components/sections/Header";
import { Hero } from "@/components/sections/Hero";
import { Stats } from "@/components/sections/Stats";
import { Findings } from "@/components/sections/Findings";
import { Breakdown } from "@/components/sections/Breakdown";
import { Compare } from "@/components/sections/Compare";
import { Signature } from "@/components/sections/Signature";
import { Cta } from "@/components/sections/Cta";
import { About } from "@/components/sections/About";
import { Services } from "@/components/sections/Services";
import { Gallery } from "@/components/sections/Gallery";
import { Hours } from "@/components/sections/Hours";
import { Contact } from "@/components/sections/Contact";
import { Footer } from "@/components/sections/Footer";

// Read the tenant record on every request so new records and status changes
// take effect immediately — no rebuild, no redeploy.
export const dynamic = "force-dynamic";

export default async function Page() {
  const t = await getTenant();
  // Unknown host, or a tenant flipped offline (the instant kill switch) → a
  // neutral, brand-free 404. Reads the record on every request, so status
  // changes take effect immediately with no restart or redeploy.
  if (!t || t.status !== "published") notFound();

  const d = t.data;

  // Each section is present only when it carries renderable data; the rest
  // are null and simply never appear.
  const sections: Record<SectionKey, ReactNode> = {
    hero: <Hero data={d} />,
    stats: d.stats ? <Stats stats={d.stats} /> : null,
    findings: d.findings ? <Findings findings={d.findings} /> : null,
    breakdown: d.breakdown ? <Breakdown breakdown={d.breakdown} /> : null,
    compare: d.compare ? <Compare compare={d.compare} /> : null,
    signature: d.signature ? <Signature signature={d.signature} /> : null,
    about: d.about ? <About about={d.about} /> : null,
    services: d.services ? <Services services={d.services} /> : null,
    gallery: d.gallery ? <Gallery gallery={d.gallery} /> : null,
    hours: d.hours ? <Hours hours={d.hours} /> : null,
    contact: d.contact ? (
      <Contact contact={d.contact} dir={d.locale.dir} />
    ) : null,
    cta: d.cta ? <Cta cta={d.cta} /> : null,
  };

  return (
    <>
      <Header brand={d.brand} cta={d.hero.ctas[0]} />
      <main>
        {/* The section key doubles as an anchor, so a record can link to its
            own sections (e.g. a hero CTA pointing at "#compare"). */}
        {d.order.map((key) => (
          <div key={key} id={key}>
            {sections[key]}
          </div>
        ))}
      </main>
      <Footer name={d.brand.name} />
    </>
  );
}
