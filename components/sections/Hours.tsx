import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

export function Hours({
  hours,
}: {
  hours: NonNullable<NormalizedTenant["hours"]>;
}) {
  return (
    <Section>
      {hours.title ? <SectionTitle>{hours.title}</SectionTitle> : null}
      <dl
        className={`max-w-xl divide-y divide-line overflow-hidden rounded-[var(--radius)] border border-line ${
          hours.title ? "mt-10" : ""
        }`}
      >
        {hours.rows.map((row, i) => (
          <div
            key={i}
            className="flex items-center justify-between gap-4 px-5 py-4"
          >
            <dt className="font-medium text-fg">{row.label}</dt>
            <dd className="text-end text-muted">{row.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}
