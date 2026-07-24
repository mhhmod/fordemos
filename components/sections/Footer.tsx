// Slim closing footer. Carries the brand name (data) and a fixed GrindCTRL
// attribution. The bottom padding clears the fixed demo mark.
export function Footer({ name }: { name: string }) {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-canvas pb-24 pt-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-2 px-5 text-center sm:px-8">
        <span className="font-heading text-base font-semibold text-fg">
          {name}
        </span>
        <span className="text-xs text-muted">
          © {year} · Concept demonstration by GrindCTRL
        </span>
      </div>
    </footer>
  );
}
