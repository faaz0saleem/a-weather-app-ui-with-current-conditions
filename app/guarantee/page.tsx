import type { Metadata } from "next";
import Link from "next/link";
import { Bike, ChefHat, CloudRain, Gauge, HandCoins, MapPin, Scale, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { JsonLd, breadcrumbLd, faqLd } from "@/components/seo";
import { ClosingCta, FaqList, OrderButton } from "@/components/site-chrome";
import { brand } from "@/config/brand";
import { FAQ } from "@/config/faq";
import { rs, site } from "@/config/site";

const trail = [{ name: "The guarantee", path: "/guarantee/" }];
const description = `How ${brand.name}'s 30-minute delivery guarantee works: when the clock starts, where it stops, what is free (up to ${rs(site.freeCapPkr)}) and when it pauses.`;

export const metadata: Metadata = {
  title: "30-minute delivery guarantee: late means free",
  description,
  alternates: { canonical: "/guarantee/" },
  openGraph: { url: "/guarantee/", title: `The ${brand.name} 30-minute guarantee`, description },
};

const TIMELINE = [
  { at: "0:00", title: "You tap Place order", body: "The 30-minute clock starts on our server and appears on your screen. It does not wait for the kitchen." },
  { at: "by 2:00", title: "The kitchen accepts", body: `It commits to a prep time, never more than ${site.fastLaneMin} minutes. If nobody accepts in 2 minutes the order cancels and you pay nothing.` },
  { at: "cooking", title: "Your rider is already moving", body: "While the food cooks, the nearest free rider heads to the counter, so nothing waits on the pass." },
  { at: "pickup", title: "Sealed and photographed", body: "The kitchen snaps a photo of your sealed bag. You see it in the app the moment it's handed over." },
  { at: "on the way", title: "Live on the map", body: "You follow the rider all the way, with a call button if your gate is hard to find." },
  { at: "at your gate", title: "The clock stops", body: `It stops when the rider reaches your gate, within ${site.geofenceM} metres of your pin. Walking out to collect doesn't count.` },
  { at: "30:00", title: "Late? It's on us", body: `If the rider isn't at your gate by 30:00, the order is free up to ${rs(site.freeCapPkr)}. The rider collects Rs 0.` },
];

const WHY = [
  { icon: ChefHat, title: "Fast-lane menus", body: `Only dishes a kitchen can finish in ${site.fastLaneMin} minutes or less are listed. Slow dishes stay off, however popular.` },
  { icon: MapPin, title: "Small zone, close kitchens", body: "Kitchens sit in two hubs inside the delivery area. Short rides leave most of the 30 minutes for cooking." },
  { icon: Gauge, title: "We check before we say yes", body: "Before your order is accepted the app checks the kitchen's queue, the nearest rider and the ride to your pin. If the numbers don't fit, it tells you when to try again." },
  { icon: Scale, title: "Kitchens share the promise", body: "When a late order was caused by the kitchen running past its own prep time, the kitchen pays for it. That keeps prep times honest." },
];

const GUARANTEE_FAQ = FAQ.filter((f) => /late|whole order|rain|clock|penalised/i.test(f.q));

export default function GuaranteePage() {
  return (
    <>
      <JsonLd data={[breadcrumbLd(trail), faqLd(GUARANTEE_FAQ)]} />
      <PageHero
        trail={trail}
        eyebrow="The 30-minute guarantee"
        title="At your gate in 30 minutes, or the order is free."
        intro={`Other apps give you an estimate. ${brand.name} puts a live clock on every order and pays for the food when we miss it. Here is exactly how it works, minute by minute.`}
      >
        <OrderButton className="h-14 px-8 text-lg" />
      </PageHero>

      <section className="mx-auto max-w-4xl px-5 py-20">
        <h2 className="font-display text-4xl font-extrabold">One order, minute by minute</h2>
        <ol className="mt-10 space-y-0">
          {TIMELINE.map((t, i) => (
            <li key={t.title} className="grid grid-cols-[5.5rem_1fr] gap-x-5 sm:grid-cols-[7rem_1fr]">
              <p className={`tabular pt-0.5 text-right font-display text-lg font-extrabold ${i === TIMELINE.length - 1 ? "text-gold-deep" : "text-brand-deep"}`}>{t.at}</p>
              <div className={`relative border-l-2 pb-9 pl-6 ${i === TIMELINE.length - 1 ? "border-transparent" : "border-line"}`}>
                <span aria-hidden className={`absolute top-1.5 -left-[9px] size-4 rounded-full ${i === TIMELINE.length - 1 ? "bg-gold" : "bg-brand"}`} />
                <h3 className="font-display text-xl font-bold">{t.title}</h3>
                <p className="mt-1 text-ink-soft">{t.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="bg-card py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-2xl font-display text-4xl font-extrabold">Why we can keep it</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">Speed comes from how the system is set up. It never comes from asking a rider to go faster.</p>
          <ul className="mt-10 grid gap-5 md:grid-cols-2">
            {WHY.map((w) => (
              <li key={w.title} className="flex gap-4 rounded-3xl bg-cream p-6">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-ink text-brand">
                  <w.icon className="size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold">{w.title}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{w.body}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-20 md:grid-cols-3">
        <article className="rounded-3xl bg-card p-6 shadow-soft">
          <HandCoins className="size-8 text-brand-deep" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-extrabold">What &ldquo;free&rdquo; means</h2>
          <p className="mt-2 text-ink-soft">
            The whole order including delivery, up to {rs(site.freeCapPkr)}. On a bigger order you pay only the part above {rs(site.freeCapPkr)}. You pay cash
            on delivery, so a free order simply means the rider collects nothing.
          </p>
        </article>
        <article className="rounded-3xl bg-card p-6 shadow-soft">
          <CloudRain className="size-8 text-brand-deep" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-extrabold">When the promise pauses</h2>
          <p className="mt-2 text-ink-soft">
            In heavy rain we switch on Rain Mode and pause the timer for everyone. The app says so, with an honest longer estimate, before you place the
            order. We never switch it on after you&apos;ve ordered.
          </p>
        </article>
        <article className="rounded-3xl bg-ink p-6 text-cream">
          <ShieldCheck className="size-8 text-brand" aria-hidden />
          <h2 className="mt-4 font-display text-2xl font-extrabold">Riders never race</h2>
          <p className="mt-2 text-cream/80">
            Riders can&apos;t see your countdown. Their pay per job is fixed and never cut for a late order. If we lose the race, {brand.name} pays, not the
            rider.
          </p>
          <Link href="/riders/" className="mt-4 inline-flex items-center gap-2 font-bold text-brand underline-offset-4 hover:underline">
            <Bike className="size-4" aria-hidden /> How riding with us works
          </Link>
        </article>
      </section>

      <section className="mx-auto max-w-3xl px-5">
        <h2 className="font-display text-4xl font-extrabold">Guarantee questions</h2>
        <div className="mt-6">
          <FaqList items={GUARANTEE_FAQ} />
        </div>
        <p className="mt-6 text-ink-soft">
          The exact wording is in the <Link href="/terms/" className="font-bold text-brand-deep underline underline-offset-4">terms of the guarantee</Link>.
        </p>
      </section>

      <ClosingCta title="Put us on the clock." body="30 minutes to your gate, or the order is on us." />
    </>
  );
}
