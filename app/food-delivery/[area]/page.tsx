import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Bike, ChefHat, Info, Timer } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { JsonLd, breadcrumbLd, faqLd, serviceLd } from "@/components/seo";
import { ClosingCta, FaqList, OrderButton } from "@/components/site-chrome";
import { AREAS, areaPath } from "@/config/areas";
import { brand } from "@/config/brand";
import { rs, site } from "@/config/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return AREAS.map((a) => ({ area: a.slug }));
}

const find = (slug: string) => AREAS.find((a) => a.slug === slug);

export async function generateMetadata({ params }: { params: Promise<{ area: string }> }): Promise<Metadata> {
  const a = find((await params).area);
  if (!a) return {};
  const description = `Order food in ${a.name}, Lahore with ${brand.name}: at your gate in 30 minutes or the order is free, up to ${rs(site.freeCapPkr)}. ${a.summary}`;
  return {
    title: `Food delivery in ${a.name}, Lahore: 30 minutes or free`,
    description,
    alternates: { canonical: areaPath(a) },
    openGraph: { url: areaPath(a), title: `Food delivery in ${a.name} in 30 minutes, or it's free`, description },
  };
}

export default async function AreaPage({ params }: { params: Promise<{ area: string }> }) {
  const a = find((await params).area);
  if (!a) notFound();
  const trail = [
    { name: "Where we deliver", path: "/food-delivery/" },
    { name: a.name, path: areaPath(a) },
  ];
  const others = AREAS.filter((o) => o.slug !== a.slug);
  return (
    <>
      <JsonLd data={[breadcrumbLd(trail), serviceLd(a.name, areaPath(a)), faqLd(a.faq)]} />
      <PageHero
        trail={trail}
        eyebrow={site.launched ? "Now delivering" : "Launching soon"}
        title={`Food delivery in ${a.name}, in 30 minutes or it's free.`}
        intro={`${site.foods.slice(0, 4).join(", ")} and more, raced to your gate in ${a.name}, Lahore. Every order carries a live 30-minute clock. If we're late, the order is free, up to ${rs(site.freeCapPkr)}.`}
      >
        <OrderButton className="h-14 px-8 text-lg" />
      </PageHero>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-20 md:grid-cols-3">
        <article className="rounded-3xl bg-card p-6 shadow-soft">
          <ChefHat className="size-8 text-brand-deep" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-extrabold">Where your food is cooked</h2>
          <p className="mt-1 text-sm font-bold text-brand-deep">{a.hub}</p>
          <p className="mt-2 text-ink-soft">{a.source}</p>
        </article>
        <article className="rounded-3xl bg-card p-6 shadow-soft">
          <Bike className="size-8 text-brand-deep" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-extrabold">The ride to your gate</h2>
          <p className="mt-2 text-ink-soft">{a.ride}</p>
        </article>
        <article className="rounded-3xl bg-card p-6 shadow-soft">
          <Info className="size-8 text-brand-deep" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-extrabold">Good to know</h2>
          <p className="mt-2 text-ink-soft">{a.note}</p>
        </article>
      </section>

      <section className="bg-card py-20">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2">
          <div>
            <h2 className="font-display text-4xl font-extrabold">What you can order in {a.name}</h2>
            <p className="mt-3 text-ink-soft">
              Every dish is one its kitchen can finish in {site.fastLaneMin} minutes or less. Pay cash on delivery.
            </p>
            <ul className="mt-6 flex flex-wrap gap-2">
              {site.foods.map((f) => (
                <li key={f} className="rounded-full bg-cream px-3.5 py-2 text-sm font-semibold">
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl bg-ink p-8 text-cream">
            <Timer className="size-8 text-brand" aria-hidden />
            <h2 className="mt-4 font-display text-3xl font-extrabold">The same promise in every phase</h2>
            <p className="mt-3 text-cream/80">
              The clock starts when you tap Place order and stops when your rider reaches your gate, within {site.geofenceM} metres of your pin. Past 30
              minutes, the order is free up to {rs(site.freeCapPkr)}.
            </p>
            <Link href="/guarantee/" className="mt-5 inline-flex items-center gap-2 font-bold text-brand underline-offset-4 hover:underline">
              How the guarantee works <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-5 pt-20">
        <h2 className="font-display text-4xl font-extrabold">{a.name} questions</h2>
        <div className="mt-6">
          <FaqList items={a.faq} />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pt-16">
        <h2 className="font-display text-2xl font-extrabold">We also deliver in</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {others.map((o) => (
            <li key={o.slug}>
              <Link href={areaPath(o)} className="inline-flex h-12 items-center gap-2 rounded-2xl border border-line bg-card px-5 font-bold hover:bg-muted">
                {o.name} <ArrowRight className="size-4" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <ClosingCta title={`Hungry in ${a.name}?`} />
    </>
  );
}
