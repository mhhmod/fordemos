import type { NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";

export function About({
  about,
}: {
  about: NonNullable<NormalizedTenant["about"]>;
}) {
  return (
    <Section surface>
      {about.title ? <SectionTitle>{about.title}</SectionTitle> : null}
      <p
        className={`max-w-3xl whitespace-pre-line text-lg leading-relaxed text-muted ${
          about.title ? "mt-6" : ""
        }`}
      >
        {about.body}
      </p>
    </Section>
  );
}
