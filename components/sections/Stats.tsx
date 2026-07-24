import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

// Headline figures. `emphasis` tints a value with the accent token so a record
// can mark a figure that reads as a strength; it carries no other meaning.
export function Stats({
  stats,
}: {
  stats: NonNullable<NormalizedTenant["stats"]>;
}) {
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
            <div
              className={`font-heading text-[clamp(1.9rem,5vw,2.6rem)] font-bold leading-none break-words ${
                item.emphasis ? "text-accent" : "text-fg"
              }`}
            >
              {item.value}
            </div>
            <div className="mt-3 text-sm font-medium text-fg">{item.label}</div>
            {item.note ? (
              <div className="mt-1 text-sm leading-relaxed text-muted">
                {item.note}
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </Section>
  );
}
