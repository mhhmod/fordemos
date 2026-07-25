import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

// Headline figures, in one of two compositions:
//   tiles — a bordered grid, each figure in its own cell
//   band  — one edge-to-edge row of hairline-separated columns, read as an
//           instrument panel rather than a set of cards
// `emphasis` tints a value with the accent token so a record can mark a figure
// that reads as a strength; it carries no other meaning.

export function Stats({
  stats,
}: {
  stats: NonNullable<NormalizedTenant["stats"]>;
}) {
  const Figure = ({
    item,
  }: {
    item: NonNullable<NormalizedTenant["stats"]>["items"][number];
  }) => (
    <>
      <div
        className={`font-heading font-bold leading-none break-words ${
          item.emphasis ? "text-accent" : "text-fg"
        }`}
        style={{
          fontSize:
            "clamp(1.9rem, 5vw, calc(var(--display-max, 4rem) * 0.72))",
        }}
      >
        {item.value}
      </div>
      <div className="mt-3 text-sm font-medium break-words text-fg">
        {item.label}
      </div>
      {item.note ? (
        <div className="mt-1 text-sm leading-relaxed break-words text-muted">
          {item.note}
        </div>
      ) : null}
    </>
  );

  if (stats.variant === "band") {
    return (
      <section className="bg-canvas">
        <div
          className="border-y border-line"
          style={{ borderWidth: "var(--rule) 0" }}
        >
          <div
            className="mx-auto grid w-full grid-cols-2 gap-px bg-line px-0 lg:grid-cols-4"
            style={{ maxWidth: "var(--measure)" }}
          >
            {stats.items.map((item, i) => (
              <div key={i} className="bg-canvas px-5 py-8 sm:px-6">
                <Figure item={item} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <Section surface>
      {stats.title ? <SectionTitle>{stats.title}</SectionTitle> : null}
      <div
        className={`grid gap-px overflow-hidden rounded-[var(--radius)] border border-line bg-line sm:grid-cols-2 lg:grid-cols-4 ${
          stats.title ? "mt-10" : ""
        }`}
      >
        {stats.items.map((item, i) => (
          <div key={i} className="bg-canvas p-6">
            <Figure item={item} />
          </div>
        ))}
      </div>
    </Section>
  );
}
