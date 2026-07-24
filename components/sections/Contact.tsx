import type { Dir, NormalizedTenant } from "@/lib/tenant";
import { Section, SectionTitle } from "@/components/Section";
import { MailIcon, PhoneIcon, PinIcon, SocialIcon } from "@/components/Icons";

// Details are conveyed by icon + value, so the section injects no UI copy of
// its own. Each row appears only when that detail exists.
export function Contact({
  contact,
  dir,
}: {
  contact: NonNullable<NormalizedTenant["contact"]>;
  dir: Dir;
}) {
  const hasDetails = !!(contact.phone || contact.email || contact.address);

  return (
    <Section surface>
      {contact.title ? <SectionTitle>{contact.title}</SectionTitle> : null}
      <div
        className={`grid gap-8 md:grid-cols-2 md:items-start ${
          contact.title ? "mt-10" : ""
        }`}
      >
        {hasDetails ? (
          <ul className="space-y-4">
            {contact.phone ? (
              <li>
                <a
                  href={`tel:${contact.phone.replace(/[^+\d]/g, "")}`}
                  className="inline-flex items-center gap-3 text-fg transition-colors hover:text-primary"
                >
                  <PhoneIcon className="shrink-0 text-muted" />
                  <span dir="ltr">{contact.phone}</span>
                </a>
              </li>
            ) : null}
            {contact.email ? (
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="inline-flex items-center gap-3 break-all text-fg transition-colors hover:text-primary"
                >
                  <MailIcon className="shrink-0 text-muted" />
                  <span>{contact.email}</span>
                </a>
              </li>
            ) : null}
            {contact.address ? (
              <li>
                {contact.map ? (
                  <a
                    href={contact.map}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="inline-flex items-start gap-3 text-fg transition-colors hover:text-primary"
                  >
                    <PinIcon className="mt-0.5 shrink-0 text-muted" />
                    <span>{contact.address}</span>
                  </a>
                ) : (
                  <span className="inline-flex items-start gap-3 text-fg">
                    <PinIcon className="mt-0.5 shrink-0 text-muted" />
                    <span>{contact.address}</span>
                  </span>
                )}
              </li>
            ) : null}
          </ul>
        ) : null}

        {contact.socials.length ? (
          <div
            dir={dir}
            className={`flex flex-wrap gap-3 ${hasDetails ? "md:justify-end" : ""}`}
          >
            {contact.socials.map((social, i) => (
              <a
                key={i}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer nofollow"
                aria-label={social.label}
                title={social.label}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-canvas text-fg transition-colors hover:bg-primary hover:text-on-primary"
              >
                <SocialIcon type={social.type} />
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </Section>
  );
}
