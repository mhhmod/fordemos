import type { Dir } from "@/lib/tenant";

// The honesty layer. Present on every published tenant page, deliberately
// styled OUTSIDE the tenant's theme so it reads as our meta-mark, not their
// brand. States plainly that this is a GrindCTRL concept demo — not the
// business's own website. The descriptive line can be localised per tenant
// via `demo.note`; the GrindCTRL attribution is fixed.
export function DemoMark({
  name,
  note,
  dir,
}: {
  name: string;
  note?: string;
  dir: Dir;
}) {
  const text = note ?? `Concept demo — not the official website of ${name}.`;

  return (
    <div
      dir={dir}
      className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-neutral-900/92 text-neutral-100 backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-center gap-x-3 gap-y-1 px-4 py-2.5 text-xs sm:justify-between sm:text-sm">
        <span className="inline-flex items-center gap-2">
          <span
            aria-hidden
            className="inline-block h-2 w-2 rotate-45 bg-amber-400"
          />
          <span className="font-semibold tracking-wide">DEMO</span>
          <span className="text-neutral-300">{text}</span>
        </span>
        <a
          href="https://grindctrl.cloud"
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="shrink-0 rounded-full bg-white px-3 py-1 font-semibold text-neutral-900 transition-colors hover:bg-neutral-200"
        >
          Built by GrindCTRL
        </a>
      </div>
    </div>
  );
}
