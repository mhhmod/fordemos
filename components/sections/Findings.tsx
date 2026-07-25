import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle, Label } from "@/components/Section";

// Ranked observations. An item carrying a picture becomes a full editorial row
// with the photograph alternating sides; items without one stay a tight
// numbered list. Both shapes can sit in the same section, so a record can
// illustrate only the findings worth illustrating.
//
// The rank is editorial order, never a severity scale, so it is set in the
// accent token rather than a traffic light.

export function Findings({
  findings,
}: {
  findings: NonNullable<NormalizedTenant["findings"]>;
}) {
  return (
    <Section>
      {findings.title ? <SectionTitle>{findings.title}</SectionTitle> : null}
      <ol
        className={`flex flex-col gap-[var(--gutter)] ${
          findings.title ? "mt-10" : ""
        }`}
      >
        {findings.items.map((item, i) => {
          const body = (
            <div className="flex min-w-0 flex-col gap-2">
              <Label className="!text-accent">{item.rank}</Label>
              <h3 className="font-heading text-lg font-semibold break-words text-fg">
                {item.title}
              </h3>
              {item.detail ? (
                <p className="max-w-prose break-words leading-relaxed text-muted">
                  {item.detail}
                </p>
              ) : null}
              {item.action ? (
                <p className="mt-1 text-sm font-medium break-words text-accent">
                  {item.action}
                </p>
              ) : null}
            </div>
          );

          if (item.image) {
            return (
              <li
                key={i}
                className="grid items-center gap-[var(--gutter)] border-t border-line pt-[var(--gutter)] first:border-t-0 first:pt-0 lg:grid-cols-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.image}
                  alt=""
                  aria-hidden
                  loading="lazy"
                  className={`w-full rounded-[var(--radius)] object-cover ${
                    i % 2 ? "lg:order-last" : ""
                  }`}
                  style={{ aspectRatio: "var(--img-ratio)" }}
                />
                {body}
              </li>
            );
          }

          return (
            <li
              key={i}
              className="border-t border-line pt-[var(--gutter)] first:border-t-0 first:pt-0"
            >
              {body}
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
