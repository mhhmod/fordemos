import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

// Who is speaking. A demonstration sent to a stranger is anonymous until
// somebody signs it, so this section exists to attach a person to the work.
export function Signature({
  signature,
}: {
  signature: NonNullable<NormalizedTenant["signature"]>;
}) {
  return (
    <Section surface>
      {signature.title ? <SectionTitle>{signature.title}</SectionTitle> : null}
      <div
        className={`flex flex-col gap-6 rounded-[var(--radius)] border border-line p-6 sm:flex-row sm:items-start sm:gap-8 sm:p-8 ${
          signature.title ? "mt-10" : ""
        }`}
      >
        {signature.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={signature.avatar}
            alt={signature.name}
            loading="lazy"
            className="h-20 w-20 shrink-0 rounded-full object-cover"
          />
        ) : null}
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <div className="font-heading text-lg font-semibold break-words text-fg">
              {signature.name}
            </div>
            {signature.role ? (
              <div className="mt-1 break-words text-sm text-muted">
                {signature.role}
              </div>
            ) : null}
          </div>
          {signature.note ? (
            <p className="max-w-prose break-words leading-relaxed text-muted">
              {signature.note}
            </p>
          ) : null}
          {signature.proof.length ? (
            <ul className="mt-1 flex flex-col gap-2">
              {signature.proof.map((point, i) => (
                <li
                  key={i}
                  className="flex gap-3 break-words text-sm leading-relaxed text-fg"
                >
                  <span aria-hidden="true" className="text-accent">
                    &mdash;
                  </span>
                  <span className="min-w-0">{point}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </Section>
  );
}
