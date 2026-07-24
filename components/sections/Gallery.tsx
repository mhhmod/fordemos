import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

export function Gallery({
  gallery,
}: {
  gallery: NonNullable<NormalizedTenant["gallery"]>;
}) {
  return (
    <Section surface>
      {gallery.title ? <SectionTitle>{gallery.title}</SectionTitle> : null}
      <div
        className={`grid grid-cols-2 gap-3 sm:grid-cols-3 ${
          gallery.title ? "mt-10" : ""
        }`}
      >
        {gallery.images.map((img, i) => (
          <div
            key={i}
            className="aspect-[4/3] overflow-hidden rounded-[var(--radius)] border border-line bg-canvas"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
            />
          </div>
        ))}
      </div>
    </Section>
  );
}
