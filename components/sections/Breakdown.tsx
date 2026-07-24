import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

// Labelled bars. Every value is also stated as text, so the chart is never the
// only way to read the number.
export function Breakdown({
  breakdown,
}: {
  breakdown: NonNullable<NormalizedTenant["breakdown"]>;
}) {
  return (
    <Section surface>
      {breakdown.title ? <SectionTitle>{breakdown.title}</SectionTitle> : null}
      {breakdown.note ? (
        <p className="mt-3 text-sm text-muted">{breakdown.note}</p>
      ) : null}
      <dl
        className={`flex flex-col gap-4 ${
          breakdown.title || breakdown.note ? "mt-10" : ""
        }`}
      >
        {breakdown.rows.map((row, i) => {
          const pct = Math.min(100, Math.max(0, (row.value / breakdown.max) * 100));
          return (
            <div
              key={i}
              className="grid grid-cols-[5rem_1fr_minmax(0,max-content)] items-center gap-3 sm:grid-cols-[8rem_1fr_minmax(0,max-content)] sm:gap-4"
            >
              <dt className="truncate text-sm text-muted">{row.label}</dt>
              <div
                aria-hidden="true"
                className="h-2 overflow-hidden rounded-full bg-accent-soft"
              >
                <div
                  className="h-full rounded-full bg-accent"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <dd className="text-end text-sm font-semibold tabular-nums text-fg">
                {row.value}
                {breakdown.unit ? (
                  <span aria-hidden="true">{breakdown.unit}</span>
                ) : null}
                {row.caption ? (
                  <span className="ms-2 font-normal text-muted">{row.caption}</span>
                ) : null}
              </dd>
            </div>
          );
        })}
      </dl>
    </Section>
  );
}
