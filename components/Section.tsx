import type { ReactNode } from "react";

// A consistent vertical rhythm and reading measure for every section. Sections
// alternate `surface`/canvas backgrounds for a composed, banded layout.
export function Section({
  children,
  surface = false,
}: {
  children: ReactNode;
  surface?: boolean;
}) {
  return (
    <section className={surface ? "bg-surface" : "bg-canvas"}>
      <div className="mx-auto w-full max-w-5xl px-5 py-16 sm:px-8 sm:py-24">
        {children}
      </div>
    </section>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-semibold text-fg">
      {children}
    </h2>
  );
}
