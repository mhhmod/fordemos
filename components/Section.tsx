import type { CSSProperties, ReactNode } from "react";

// Vertical rhythm and reading measure come from the tenant's layout preset, so
// the same component composes a wide technical grid or a narrow editorial
// column depending only on the record. Sections alternate surface/canvas.
export function Section({
  children,
  surface = false,
  bleed = false,
}: {
  children: ReactNode;
  surface?: boolean;
  /** Run the section edge to edge; the inner measure no longer applies. */
  bleed?: boolean;
}) {
  const style: CSSProperties = {
    paddingBlock: "var(--rhythm)",
    ...(bleed ? {} : { maxWidth: "var(--measure)" }),
  };
  return (
    <section className={surface ? "bg-surface" : "bg-canvas"}>
      <div className="mx-auto w-full px-5 sm:px-8" style={style}>
        {children}
      </div>
    </section>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2
      className="font-semibold text-fg"
      style={{
        fontSize:
          "clamp(1.45rem, 3.2vw, calc(var(--display-max, 4rem) * 0.62))",
      }}
    >
      {children}
    </h2>
  );
}

// Eyebrows, column heads and captions. Case and tracking are the loudest part
// of a layout's accent, so they live in the preset rather than in the markup.
export function Label({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`block text-muted ${className}`}
      style={{
        textTransform: "var(--label-case)" as CSSProperties["textTransform"],
        letterSpacing: "var(--label-track)",
        fontSize: "var(--label-size)",
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  );
}
