export function SectionHead({ id, kicker, title }: { id: string; kicker: string; title?: string }) {
  return (
    <header className="mb-6 flex flex-col gap-3">
      <p className="font-mono text-sm font-semibold tracking-wide text-stamp">{kicker}</p>
      {title && <h2 id={id} className="display text-4xl sm:text-5xl">{title}</h2>}
    </header>
  );
}
