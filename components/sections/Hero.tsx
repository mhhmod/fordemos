import type { NormalizedTenant } from "@/lib/tenant";
import { Label } from "@/components/Section";

// The anchor, in one of three compositions chosen by the record:
//   banner — full-bleed photograph with a legible scrim over it
//   split  — picture and words side by side, each holding its own column
//   stack  — no picture, type carrying the whole opening
// Without a usable image, banner and split both fall back to stack rather than
// reserving space for something that will never arrive.

function Ctas({
  ctas,
  onImage,
}: {
  ctas: NormalizedTenant["hero"]["ctas"];
  onImage: boolean;
}) {
  if (!ctas.length) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-3">
      {ctas.map((c, i) => (
        <a
          key={i}
          href={c.href}
          className={
            i === 0
              ? "rounded-[var(--radius)] bg-primary px-6 py-3 text-sm font-semibold break-words text-on-primary transition-transform hover:-translate-y-0.5"
              : `rounded-[var(--radius)] px-6 py-3 text-sm font-semibold break-words transition-colors ${
                  onImage
                    ? "bg-white/15 text-white backdrop-blur hover:bg-white/25"
                    : "border border-line bg-canvas text-fg hover:bg-surface"
                }`
          }
        >
          {c.label}
        </a>
      ))}
    </div>
  );
}

export function Hero({ data }: { data: NormalizedTenant }) {
  const { hero, brand } = data;
  const image = hero.image;
  const variant = image ? hero.variant : "stack";

  const Headline = (
    <h1
      className="max-w-[22ch] font-semibold leading-[1.04] tracking-tight break-words"
      style={{
        fontSize:
          "clamp(var(--display-min, 2.25rem), 6vw, var(--display-max, 4rem))",
      }}
    >
      {hero.headline}
    </h1>
  );

  if (variant === "split") {
    return (
      <section id="top" className="bg-canvas">
        <div
          className="mx-auto grid w-full items-center gap-[var(--gutter)] px-5 sm:px-8 lg:grid-cols-2"
          style={{ maxWidth: "var(--measure)", paddingBlock: "var(--rhythm)" }}
        >
          <div className="flex min-w-0 flex-col items-start gap-5 text-fg">
            {brand.tagline ? <Label>{brand.tagline}</Label> : null}
            {Headline}
            {hero.sub ? (
              <p className="max-w-prose leading-relaxed break-words text-muted">
                {hero.sub}
              </p>
            ) : null}
            <Ctas ctas={hero.ctas} onImage={false} />
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image}
            alt=""
            aria-hidden
            className="w-full rounded-[var(--radius)] object-cover"
            style={{ aspectRatio: "var(--img-ratio)" }}
          />
        </div>
      </section>
    );
  }

  if (variant === "banner") {
    return (
      <section id="top" className="relative isolate overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-10 h-full w-full object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 -z-10 bg-gradient-to-t from-black/85 via-black/50 to-black/25"
        />
        <div
          className="mx-auto flex w-full flex-col items-start gap-6 px-5 text-white sm:px-8"
          style={{
            maxWidth: "var(--measure)",
            paddingBlock: "calc(var(--rhythm) * 1.6)",
          }}
        >
          {brand.tagline ? (
            <Label className="!text-white/70">{brand.tagline}</Label>
          ) : null}
          {Headline}
          {hero.sub ? (
            <p className="max-w-xl leading-relaxed break-words text-white/85">
              {hero.sub}
            </p>
          ) : null}
          <Ctas ctas={hero.ctas} onImage />
        </div>
      </section>
    );
  }

  return (
    <section id="top" className="relative isolate overflow-hidden bg-canvas">
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, var(--color-accent-soft), var(--color-canvas) 62%)",
        }}
      />
      <div
        className="mx-auto flex w-full flex-col items-start gap-6 px-5 text-fg sm:px-8"
        style={{
          maxWidth: "var(--measure)",
          paddingBlock: "calc(var(--rhythm) * 1.4)",
        }}
      >
        {brand.tagline ? <Label>{brand.tagline}</Label> : null}
        {Headline}
        {hero.sub ? (
          <p className="max-w-xl text-lg leading-relaxed break-words text-muted">
            {hero.sub}
          </p>
        ) : null}
        <Ctas ctas={hero.ctas} onImage={false} />
      </div>
    </section>
  );
}
