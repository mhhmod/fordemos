import type { NormalizedTenant } from "@/lib/tenant";

// The anchor. With an image it becomes a full-bleed banner with a legible
// scrim; without one it degrades to a composed, token-tinted gradient — never
// an empty frame. Always renders (headline falls back to the brand name).
export function Hero({ data }: { data: NormalizedTenant }) {
  const { hero, brand } = data;
  const hasImage = !!hero.image;

  return (
    <section id="top" className="relative isolate overflow-hidden">
      {hasImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.image}
            alt=""
            aria-hidden
            className="absolute inset-0 -z-10 h-full w-full object-cover"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-gradient-to-t from-black/80 via-black/45 to-black/25"
          />
        </>
      ) : (
        <div
          aria-hidden
          className="absolute inset-0 -z-10"
          style={{
            background:
              "radial-gradient(120% 120% at 50% 0%, var(--color-accent-soft), var(--color-canvas) 62%)",
          }}
        />
      )}

      <div
        className={`rise mx-auto flex w-full max-w-5xl flex-col items-start gap-6 px-5 sm:px-8 ${
          hasImage ? "py-28 sm:py-44" : "py-24 sm:py-36"
        }`}
      >
        {brand.tagline && !hasImage ? (
          <span className="rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted">
            {brand.tagline}
          </span>
        ) : null}

        <h1
          className={`max-w-3xl text-[clamp(2.25rem,6vw,4rem)] font-semibold leading-[1.03] tracking-tight ${
            hasImage ? "text-white" : "text-fg"
          }`}
        >
          {hero.headline}
        </h1>

        {hero.sub ? (
          <p
            className={`max-w-xl text-lg leading-relaxed ${
              hasImage ? "text-white/85" : "text-muted"
            }`}
          >
            {hero.sub}
          </p>
        ) : null}

        {hero.ctas.length ? (
          <div className="mt-2 flex flex-wrap gap-3">
            {hero.ctas.map((c, i) => (
              <a
                key={i}
                href={c.href}
                className={
                  i === 0
                    ? "rounded-full bg-primary px-6 py-3 text-sm font-semibold text-on-primary shadow-sm transition-transform hover:-translate-y-0.5"
                    : `rounded-full px-6 py-3 text-sm font-semibold transition-colors ${
                        hasImage
                          ? "bg-white/15 text-white backdrop-blur hover:bg-white/25"
                          : "border border-line bg-canvas text-fg hover:bg-surface"
                      }`
                }
              >
                {c.label}
              </a>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
