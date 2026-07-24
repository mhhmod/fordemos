import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

// A before/after pair. The "after" panel is the one being argued for, so it
// carries the accent; "before" stays deliberately quiet. Panels stack on narrow
// screens, where a side-by-side comparison would be unreadable anyway.
function Panel({
  panel,
  emphasis,
}: {
  panel: NonNullable<NormalizedTenant["compare"]>["before"];
  emphasis: boolean;
}) {
  return (
    <div
      className={`flex min-w-0 flex-col overflow-hidden rounded-[var(--radius)] border ${
        emphasis ? "border-accent" : "border-line"
      }`}
    >
      <div
        className={`px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] ${
          emphasis ? "bg-accent text-on-primary" : "bg-surface text-muted"
        }`}
      >
        {panel.label}
      </div>
      {panel.image ? (
        // Tenant-supplied artwork of unknown dimensions; a plain img keeps this
        // dependency-free and avoids a loader for a handful of pictures.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={panel.image}
          alt={panel.title ?? panel.label}
          loading="lazy"
          className="aspect-[4/3] w-full object-cover"
        />
      ) : null}
      <div className="flex flex-col gap-2 p-5">
        {panel.title ? (
          <h3 className="font-heading text-base font-semibold break-words text-fg">
            {panel.title}
          </h3>
        ) : null}
        {panel.body ? (
          <p className="break-words text-sm leading-relaxed text-muted">
            {panel.body}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function Compare({
  compare,
}: {
  compare: NonNullable<NormalizedTenant["compare"]>;
}) {
  return (
    <Section>
      {compare.title ? <SectionTitle>{compare.title}</SectionTitle> : null}
      {compare.note ? (
        <p className="mt-3 max-w-prose text-sm leading-relaxed text-muted">
          {compare.note}
        </p>
      ) : null}
      <div
        className={`grid gap-4 sm:grid-cols-2 ${
          compare.title || compare.note ? "mt-10" : ""
        }`}
      >
        <Panel panel={compare.before} emphasis={false} />
        <Panel panel={compare.after} emphasis />
      </div>
    </Section>
  );
}
