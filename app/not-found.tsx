import Link from "next/link";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-lg px-5 py-24 text-center">
      <p className="text-6xl">🧭</p>
      <h1 className="mt-4 font-display text-4xl font-extrabold">Yeh page nahi mila</h1>
      <p className="mt-2 text-ink-soft">That page doesn&apos;t exist — maybe the link is old.</p>
      <Link href="/" className="mt-8 inline-flex h-12 items-center rounded-2xl bg-brand px-6 font-bold text-brand-ink">
        Back home
      </Link>
    </section>
  );
}
