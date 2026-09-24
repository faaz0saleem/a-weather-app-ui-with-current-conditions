export function Legal({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <p className="mb-4 rounded-2xl bg-amber/15 px-4 py-3 text-sm font-semibold">
        Draft for the pilot — have a Pakistani lawyer review this page before public launch.
      </p>
      <h1 className="font-display text-4xl font-extrabold">{title}</h1>
      <p className="mt-1 text-sm text-ink-soft">Last updated {updated}</p>
      <div className="mt-8 space-y-4 leading-relaxed text-ink-soft [&_h2]:mt-8 [&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </article>
  );
}
