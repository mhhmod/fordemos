import type { NormalizedTenant } from "@/lib/tenant";
import { Section } from "@/components/Section";

// The closing ask. The first action is the primary button; any others render as
// quieter links beside it.
export function Cta({ cta }: { cta: NonNullable<NormalizedTenant["cta"]> }) {
  return (
    <Section>
      <div className="rounded-[var(--radius)] border border-line p-8 sm:p-12">
        {cta.title ? (
          <h2 className="font-heading text-[clamp(1.4rem,3vw,2rem)] font-semibold text-fg">
            {cta.title}
          </h2>
        ) : null}
        {cta.body ? (
          <p className="mt-3 max-w-prose leading-relaxed text-muted">{cta.body}</p>
        ) : null}
        {cta.actions.length ? (
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">
            {cta.actions.map((a, i) =>
              i === 0 ? (
                <a
                  key={i}
                  href={a.href}
                  className="inline-block rounded-full bg-primary px-7 py-3 font-semibold text-on-primary"
                >
                  {a.label}
                </a>
              ) : (
                <a
                  key={i}
                  href={a.href}
                  className="font-medium text-fg underline underline-offset-4"
                >
                  {a.label}
                </a>
              ),
            )}
          </div>
        ) : null}
      </div>
    </Section>
  );
}
