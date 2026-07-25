import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

// Real photography, in one of three compositions:
//   grid   — even columns, calm and catalogue-like
//   mosaic — the first picture takes a double cell, the rest fall around it
//   strip  — a single edge-to-edge row that scrolls sideways on its own
// Picture shape comes from the layout preset, so a square technical grid and a
// tall editorial portrait are the same component.

export function Gallery({
  gallery,
}: {
  gallery: NonNullable<NormalizedTenant["gallery"]>;
}) {
  const Img = ({
    image,
    className = "",
  }: {
    image: NonNullable<NormalizedTenant["gallery"]>["images"][number];
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={image.src}
      alt={image.alt}
      loading="lazy"
      className={`w-full rounded-[var(--radius)] object-cover ${className}`}
      style={{ aspectRatio: "var(--img-ratio)" }}
    />
  );

  if (gallery.variant === "strip") {
    return (
      <section className="bg-canvas">
        <div style={{ paddingBlock: "var(--rhythm)" }}>
          {gallery.title ? (
            <div
              className="mx-auto w-full px-5 sm:px-8"
              style={{ maxWidth: "var(--measure)" }}
            >
              <SectionTitle>{gallery.title}</SectionTitle>
            </div>
          ) : null}
          <div
            className={`flex gap-[var(--gutter)] overflow-x-auto px-5 sm:px-8 ${
              gallery.title ? "mt-10" : ""
            }`}
          >
            {gallery.images.map((image, i) => (
              <div key={i} className="w-[62vw] shrink-0 sm:w-[30vw] lg:w-[22vw]">
                <Img image={image} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (gallery.variant === "mosaic") {
    return (
      <Section>
        {gallery.title ? <SectionTitle>{gallery.title}</SectionTitle> : null}
        <div
          className={`grid grid-cols-2 gap-[var(--gutter)] lg:grid-cols-3 ${
            gallery.title ? "mt-10" : ""
          }`}
        >
          {gallery.images.map((image, i) => (
            <div
              key={i}
              className={i === 0 ? "col-span-2 row-span-2" : ""}
            >
              <Img image={image} className={i === 0 ? "h-full" : ""} />
            </div>
          ))}
        </div>
      </Section>
    );
  }

  return (
    <Section>
      {gallery.title ? <SectionTitle>{gallery.title}</SectionTitle> : null}
      <div
        className={`grid grid-cols-2 gap-[var(--gutter)] lg:grid-cols-4 ${
          gallery.title ? "mt-10" : ""
        }`}
      >
        {gallery.images.map((image, i) => (
          <Img key={i} image={image} />
        ))}
      </div>
    </Section>
  );
}
