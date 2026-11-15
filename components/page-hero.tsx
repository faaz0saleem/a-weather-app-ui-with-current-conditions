import { TruckArtPattern } from "@/components/brand";
import { Breadcrumbs } from "@/components/seo";

/** Top band for inner pages: breadcrumb, one H1, one supporting paragraph. */
export function PageHero({
  trail,
  eyebrow,
  title,
  intro,
  tone = "ink",
  children,
}: {
  trail: { name: string; path: string }[];
  eyebrow?: string;
  title: string;
  intro: string;
  tone?: "ink" | "brand";
  children?: React.ReactNode;
}) {
  return (
    <section className={`relative overflow-hidden ${tone === "ink" ? "bg-ink text-cream" : "bg-brand text-brand-ink"}`}>
      {tone === "ink" && <TruckArtPattern opacity={0.07} />}
      <div className="relative mx-auto max-w-6xl px-5 pt-8 pb-16 md:pb-20">
        <Breadcrumbs trail={trail} />
        {eyebrow && <p className="mt-10 text-sm font-bold tracking-wider uppercase opacity-80">{eyebrow}</p>}
        <h1 className={`${eyebrow ? "mt-3" : "mt-10"} max-w-4xl font-display text-[clamp(2.3rem,6vw,4.2rem)] leading-[0.98] font-extrabold`}>{title}</h1>
        <p className="mt-5 max-w-2xl text-lg opacity-85">{intro}</p>
        {children && <div className="mt-8 flex flex-wrap gap-3">{children}</div>}
      </div>
    </section>
  );
}
