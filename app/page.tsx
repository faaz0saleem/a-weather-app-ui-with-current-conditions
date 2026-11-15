import Link from "next/link";
import { ArrowRight, Bike, ChefHat, Gauge, MapPin, PartyPopper, Receipt, ShieldCheck, Timer, Zap } from "lucide-react";
import { TruckArtPattern } from "@/components/brand";
import { PhoneMock } from "@/components/phone-mock";
import { JsonLd, faqLd, serviceLd } from "@/components/seo";
import { ClosingCta, FaqList, OrderButton } from "@/components/site-chrome";
import { AREAS, areaPath } from "@/config/areas";
import { brand } from "@/config/brand";
import { FAQ } from "@/config/faq";
import { phaseList, rs, site } from "@/config/site";

const STEPS = [
  { icon: Timer, title: "The clock starts when you tap Place order", body: "Not when the kitchen gets around to it. 30:00 starts ticking on your screen the moment you commit." },
  { icon: ChefHat, title: "Fast-lane menus only", body: `Every dish on ${brand.name} is one its kitchen can finish in ${site.fastLaneMin} minutes or less, so every order can carry the promise.` },
  { icon: Gauge, title: "We only say yes when we can win", body: "Kitchen slammed or riders far away? We tell you before you order, and when to try again. No silent 50-minute waits." },
  { icon: Zap, title: "Late? It's on us.", body: `The second the timer hits zero, your screen turns gold and the order is free, up to ${rs(site.freeCapPkr)}. Pay the rider Rs 0.` },
];

const STATS = [
  { value: "30:00", label: "on the clock, every order" },
  { value: rs(site.freeCapPkr), label: "free if we're late" },
  { value: `${site.kitchens}`, label: "fast kitchens at launch" },
  { value: `${site.fastLaneMin} min`, label: "longest any dish takes to cook" },
];

const HOME_FAQ = FAQ.slice(0, 6);

export default function Home() {
  return (
    <>
      <JsonLd data={[serviceLd(), faqLd(HOME_FAQ)]} />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-12 pb-16 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div>
            <p className="mb-5 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm font-semibold shadow-soft">
              <MapPin className="size-4 text-brand-deep" aria-hidden /> {site.launched ? "Now delivering in" : "Launching soon in"} DHA {phaseList}
            </p>
            <h1 className="font-display leading-[0.95] font-extrabold">
              <span className="mb-3 block text-lg tracking-normal text-brand-deep">Food delivery in DHA Lahore</span>
              <span className="block text-[clamp(2.8rem,7vw,5.2rem)]">{brand.tagline}</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              Fried chicken, burgers, wraps and more from {site.kitchens} fast kitchens, raced to your gate. Every order carries a live 30-minute clock.
              If we&apos;re late, the whole order is free, up to {rs(site.freeCapPkr)}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <OrderButton className="h-14 px-8 text-lg" />
              <Link href="/guarantee/" className="inline-flex h-14 items-center rounded-2xl border border-line bg-card px-6 font-bold hover:bg-muted">
                How the guarantee works
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-soft">Cash on delivery. No app store needed: it opens in your phone&apos;s browser.</p>
          </div>
          <PhoneMock />
        </div>

        {/* The promise in four numbers */}
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-3xl bg-line px-0 md:grid-cols-4 max-md:mx-5">
          {STATS.map((s) => (
            <div key={s.label} className="flex flex-col-reverse bg-card p-5 md:p-6">
              <dt className="mt-1 text-sm text-ink-soft">{s.label}</dt>
              <dd className="tabular font-display text-3xl font-extrabold md:text-4xl">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* How it works */}
      <section id="how" className="mt-20 scroll-mt-28 bg-card py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-2xl font-display text-4xl font-extrabold">How the promise works</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">A guarantee is only worth something if the whole system is built to keep it. Ours is.</p>
          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-3xl bg-cream p-6">
                <span className="mb-4 flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-ink text-brand">
                    <s.icon className="size-6" aria-hidden />
                  </span>
                  <span aria-hidden className="font-display text-4xl font-extrabold text-brand-deep">0{i + 1}</span>
                </span>
                <h3 className="font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
          <Link href="/guarantee/" className="mt-8 inline-flex items-center gap-2 font-bold text-brand-deep underline-offset-4 hover:underline">
            Read the full guarantee, minute by minute <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      {/* Race screen */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-[36px] bg-ink p-8 text-cream md:p-10">
          <TruckArtPattern opacity={0.08} />
          <p className="relative text-sm font-bold tracking-wider text-brand uppercase">The race screen</p>
          <h2 className="relative mt-3 font-display text-4xl font-extrabold">Watch your food race the clock.</h2>
          <ul className="relative mt-6 space-y-3 text-cream/85">
            <li className="flex gap-3"><Timer className="size-5 shrink-0 text-brand" aria-hidden /> A big countdown ring: mint, amber under 10 minutes, red under 3, and gold when it&apos;s free.</li>
            <li className="flex gap-3"><Bike className="size-5 shrink-0 text-brand" aria-hidden /> Your rider live on the map, with a call button.</li>
            <li className="flex gap-3"><ShieldCheck className="size-5 shrink-0 text-brand" aria-hidden /> A photo of your sealed bag from the kitchen.</li>
            <li className="flex gap-3"><Receipt className="size-5 shrink-0 text-brand" aria-hidden /> One clear bill, shown in full before you place the order.</li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-4xl font-extrabold">When we&apos;re late, you&apos;ll know first.</h2>
          <p className="mt-4 text-lg text-ink-soft">
            The instant the deadline passes, your screen flips to a full-screen <b className="text-ink">&ldquo;It&apos;s on us&rdquo;</b> and you get a card to
            share on WhatsApp or Instagram. Your rider simply collects Rs 0.
          </p>
          <div className="mt-6 inline-flex items-center gap-4 rounded-3xl bg-gold px-6 py-4 text-brand-ink">
            <PartyPopper className="size-9 shrink-0" aria-hidden />
            <span>
              <span className="block font-display text-2xl font-extrabold">It&apos;s on us.</span>
              <span className="text-sm font-semibold">1 min 12 s late. Rs 1,500 off. You pay Rs 0.</span>
            </span>
          </div>
        </div>
      </section>

      {/* What and where */}
      <section id="areas" className="scroll-mt-28 bg-card py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-3xl font-display text-4xl font-extrabold">
            {site.kitchens} kitchens. Two hubs. DHA {phaseList}.
          </h2>
          <p className="mt-3 max-w-2xl text-ink-soft">We start small on purpose: kitchens close to you, menus that cook fast, riders who know the blocks.</p>
          <ul className="mt-6 flex flex-wrap gap-2">
            {site.foods.map((c) => (
              <li key={c} className="rounded-full bg-cream px-3.5 py-2 text-sm font-semibold">
                {c}
              </li>
            ))}
          </ul>
          <ul className="mt-10 grid gap-5 md:grid-cols-3">
            {AREAS.map((a) => (
              <li key={a.slug}>
                <Link href={areaPath(a)} className="group flex h-full flex-col rounded-3xl bg-cream p-6 transition-shadow hover:shadow-soft">
                  <span className="grid size-12 place-items-center rounded-2xl bg-ink text-brand">
                    <MapPin className="size-6" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-extrabold">Food delivery in {a.name}</h3>
                  <p className="mt-2 flex-1 text-sm text-ink-soft">{a.summary}</p>
                  <p className="mt-4 inline-flex items-center gap-2 font-bold text-brand-deep group-hover:underline">
                    {a.name} details <ArrowRight className="size-4" aria-hidden />
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Fine print */}
      <section id="fine-print" className="scroll-mt-28 py-20">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="font-display text-4xl font-extrabold">The fine print, in plain words</h2>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["Where the clock stops", `When your rider reaches your gate, within ${site.geofenceM} m of your pin. Chatting with the chowkidar doesn't count against us.`],
              ["What's free", `The whole order, up to ${rs(site.freeCapPkr)}. Above that, you pay only the difference.`],
              ["Rain Mode", "In heavy rain the timer pauses for everyone. You'll see that, and an honest estimate, before you order."],
              ["Where we deliver", `DHA Lahore ${phaseList}.`],
              ["How you pay", "Cash on delivery. Cards and mobile wallets come later."],
              ["If a kitchen can't take it", "You're told within 2 minutes and never charged."],
            ].map(([k, v]) => (
              <div key={k} className="rounded-3xl bg-card p-5 shadow-soft">
                <dt className="font-display text-lg font-bold">{k}</dt>
                <dd className="mt-1 text-sm text-ink-soft">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Partners */}
      <section className="mx-auto grid max-w-6xl gap-5 px-5 md:grid-cols-2">
        <Link href="/restaurants/" className="group relative overflow-hidden rounded-[36px] bg-brand p-8 text-brand-ink">
          <ChefHat className="size-10" aria-hidden />
          <h2 className="mt-4 font-display text-3xl font-extrabold">Run a kitchen in DHA?</h2>
          <p className="mt-2 max-w-md font-medium">A tablet dashboard, a loud order alarm, and a fair split clock: you&apos;re only charged when your own prep ran over.</p>
          <p className="mt-6 inline-flex items-center gap-2 font-bold group-hover:underline">Partner with us <ArrowRight className="size-4" aria-hidden /></p>
        </Link>
        <Link href="/riders/" className="group relative overflow-hidden rounded-[36px] bg-ink p-8 text-cream">
          <TruckArtPattern opacity={0.06} />
          <Bike className="relative size-10 text-brand" aria-hidden />
          <h2 className="relative mt-4 font-display text-3xl font-extrabold">Ride with {brand.name}</h2>
          <p className="relative mt-2 max-w-md text-cream/80">No countdown on your screen. Fixed pay per job, never cut for lateness. Safety first, always.</p>
          <p className="relative mt-6 inline-flex items-center gap-2 font-bold group-hover:underline">Join the fleet <ArrowRight className="size-4" aria-hidden /></p>
        </Link>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-28 px-5 pt-20">
        <h2 className="font-display text-4xl font-extrabold">Questions</h2>
        <div className="mt-6">
          <FaqList items={HOME_FAQ} />
        </div>
        <Link href="/faq/" className="mt-6 inline-flex items-center gap-2 font-bold text-brand-deep underline-offset-4 hover:underline">
          All questions and answers <ArrowRight className="size-4" aria-hidden />
        </Link>
      </section>

      <ClosingCta />
    </>
  );
}
