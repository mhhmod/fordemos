import type { Cta, NormalizedTenant } from "@/lib/tenant";

// Brand mark (logo image if supplied, otherwise a typographic wordmark from the
// name) plus an optional single call-to-action drawn from the hero.
export function Header({
  brand,
  cta,
}: {
  brand: NormalizedTenant["brand"];
  cta?: Cta;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-canvas/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-8">
        <a href="#top" className="inline-flex items-center gap-3">
          {brand.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={brand.logo.src}
              alt={brand.logo.alt}
              className="h-8 w-auto max-w-[180px] object-contain"
            />
          ) : (
            <span className="font-heading text-lg font-semibold tracking-tight text-fg">
              {brand.name}
            </span>
          )}
        </a>

        {cta ? (
          <a
            href={cta.href}
            className="hidden rounded-full bg-primary px-5 py-2 text-sm font-medium text-on-primary transition-opacity hover:opacity-90 sm:inline-block"
          >
            {cta.label}
          </a>
        ) : null}
      </div>
    </header>
  );
}
