import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

// Ranked observations. The rank is editorial order, never a severity scale, so
// it is rendered as a numeral in the accent token rather than a traffic light.
export function Findings({
  findings,
}: {
  findings: NonNullable<NormalizedTenant["findings"]>;
}) {
  return (
    <Section>
      {findings.title ? <SectionTitle>{findings.title}</SectionTitle> : null}
      <ol className={findings.title ? "mt-10" : ""}>
        {findings.items.map((item, i) => (
          <li
            key={i}
            className="flex gap-5 border-t border-line py-7 first:border-t-0 first:pt-0"
          >
            <span
              aria-hidden="true"
              className="shrink-0 pt-1 font-heading text-sm font-bold tabular-nums text-accent"
            >
              {item.rank}
            </span>
            <div className="min-w-0">
              <h3 className="font-heading text-lg font-semibold text-fg">
                {item.title}
              </h3>
              {item.detail ? (
                <p className="mt-2 leading-relaxed text-muted">{item.detail}</p>
              ) : null}
              {item.action ? (
                <p className="mt-3 text-sm font-medium text-accent">
                  {item.action}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
