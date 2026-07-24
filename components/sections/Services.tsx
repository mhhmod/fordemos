import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

// A price renders only when present; a description only when present. A service
// with just a name is still a clean card.
export function Services({
  services,
}: {
  services: NonNullable<NormalizedTenant["services"]>;
}) {
  return (
    <Section>
      {services.title ? <SectionTitle>{services.title}</SectionTitle> : null}
      <div
        className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${
          services.title ? "mt-10" : ""
        }`}
      >
        {services.items.map((item, i) => (
          <div
            key={i}
            className="flex flex-col rounded-[var(--radius)] border border-line bg-surface p-6"
          >
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="font-heading text-lg font-semibold text-fg">
                {item.name}
              </h3>
              {item.price ? (
                <span className="shrink-0 rounded-full bg-accent-soft px-3 py-1 text-sm font-semibold text-fg">
                  {item.price}
                </span>
              ) : null}
            </div>
            {item.desc ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {item.desc}
              </p>
            ) : null}
          </div>
        ))}
      </div>
    </Section>
  );
}
