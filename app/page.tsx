import Link from "next/link";
import { Bike, ChefHat, Gauge, MapPin, Receipt, ShieldCheck, Timer, Zap } from "lucide-react";
import { TruckArtPattern, TruckArtStrip } from "@/components/brand";
import { PhoneMock } from "@/components/phone-mock";
import { OrderButton } from "@/components/site-chrome";
import { brand } from "@/config/brand";
import { site } from "@/config/site";

const rs = (n: number) => `Rs ${n.toLocaleString("en-US")}`;

const STEPS = [
  { icon: Timer, title: "The clock starts when you tap Place order", body: "Not when the kitchen gets around to it. 30:00 starts ticking on your screen the moment you commit." },
  { icon: ChefHat, title: "Fast-lane menus only", body: "Every dish on WaqtPe cooks in 12 minutes or less, so every order can carry the promise." },
  { icon: Gauge, title: "We only say yes when we can win", body: "Kitchen slammed or riders far away? We tell you before you order — and when to try again. No silent 50-minute waits." },
  { icon: Zap, title: "Late? It's on us.", body: `The second the timer hits zero, your screen turns gold and the order is free — up to ${rs(site.freeCapPkr)}. Pay the rider Rs 0.` },
];

const FAQ = [
  {
    q: "What exactly counts as late?",
    a: `The clock runs from the moment you tap Place order until your rider reaches your gate — within ${site.geofenceM} metres of your pin. If that takes more than 30 minutes, the order is free.`,
  },
  {
    q: "Is the whole order free?",
    a: `Yes, up to ${rs(site.freeCapPkr)} including delivery. On a bigger order you only pay the amount above ${rs(site.freeCapPkr)}.`,
  },
  {
    q: "Why can't I order from some kitchens sometimes?",
    a: "Because we only take orders we're confident we can deliver in time. If a kitchen is too busy, too far from you, or riders are stretched, we say so honestly — with an estimate of when to try again.",
  },
  {
    q: "What happens when it rains?",
    a: "In heavy rain we switch on Rain Mode: the timer is paused app-wide and you see an honest, longer ETA before you order. You can still order — it just won't carry the 30-minute promise until the roads clear.",
  },
  {
    q: "Do riders get penalised for late orders?",
    a: "Never. Riders don't even see your countdown, their pay per job is fixed and never cut, and there is no 'hurry' messaging in their app. We'd rather give your order away than push a rider into traffic.",
  },
  { q: "How do I pay?", a: "Cash on delivery for now. JazzCash, Easypaisa and cards are coming soon." },
  { q: "Where do you deliver?", a: `${brand.area}, Phases 1–8, during the pilot. More of Lahore soon.` },
];

export default function Home() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pt-14 pb-20 md:grid-cols-[1.1fr_1fr] md:pt-20">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-card px-3 py-1.5 text-sm font-semibold shadow-soft">
              <MapPin className="size-4 text-brand-deep" /> {brand.area} · now in pilot
            </p>
            <h1 className="font-display text-[clamp(2.8rem,7vw,5.2rem)] leading-[0.95] font-extrabold">{brand.tagline}</h1>
            <p className="mt-5 max-w-xl text-lg text-ink-soft">
              Food from {site.kitchens} of DHA&apos;s favourite kitchens, raced to your gate. Every order carries a live 30-minute clock. If we&apos;re
              late, the whole order is free — up to {rs(site.freeCapPkr)}.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <OrderButton className="h-14 px-8 text-lg" />
              <Link href="#how" className="inline-flex h-14 items-center rounded-2xl border border-line bg-card px-6 font-bold hover:bg-muted">
                How it works
              </Link>
            </div>
            <p className="mt-4 text-sm text-ink-soft">No app store needed — it installs straight from your browser.</p>
          </div>
          <PhoneMock />
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="scroll-mt-20 bg-card py-20">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="max-w-2xl font-display text-4xl font-extrabold">How the promise works</h2>
          <p className="mt-2 max-w-2xl text-ink-soft">A guarantee is only worth something if the whole system is built to keep it. Ours is.</p>
          <ol className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.title} className="rounded-3xl bg-cream p-6">
                <span className="mb-4 flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-ink text-brand">
                    <s.icon className="size-6" />
                  </span>
                  <span aria-hidden className="font-display text-4xl font-extrabold text-brand-deep">0{i + 1}</span>
                </span>
                <h3 className="font-display text-xl font-bold">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-soft">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Race screen */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 md:grid-cols-2">
        <div className="relative overflow-hidden rounded-[36px] bg-ink p-8 text-cream md:p-10">
          <TruckArtPattern opacity={0.08} />
          <p className="relative text-sm font-bold tracking-wider text-brand uppercase">The race screen</p>
          <p className="relative mt-3 font-display text-4xl font-extrabold">Watch your food race the clock.</p>
          <ul className="relative mt-6 space-y-3 text-cream/85">
            <li className="flex gap-3"><Timer className="size-5 shrink-0 text-brand" /> A big countdown ring: mint, amber under 10 minutes, red under 3 — and gold when it&apos;s free.</li>
            <li className="flex gap-3"><Bike className="size-5 shrink-0 text-brand" /> Your rider live on the map, with a call button.</li>
            <li className="flex gap-3"><ShieldCheck className="size-5 shrink-0 text-brand" /> A photo of your sealed bag from the kitchen.</li>
            <li className="flex gap-3"><Receipt className="size-5 shrink-0 text-brand" /> One clear bill. No service fee, no small-order fee, no surprises.</li>
          </ul>
        </div>
        <div>
          <h2 className="font-display text-4xl font-extrabold">When we&apos;re late, you&apos;ll know first.</h2>
          <p className="mt-4 text-lg text-ink-soft">
            The instant the deadline passes, your screen flips to a full-screen <b className="text-ink">&ldquo;It&apos;s on us 🎉&rdquo;</b> — and you get a
            card to share on WhatsApp or Instagram. Your rider simply collects Rs 0.
          </p>
          <div className="mt-6 inline-flex items-center gap-4 rounded-3xl bg-gold px-6 py-4 text-brand-ink">
            <span className="text-4xl">🎉</span>
            <span>
              <span className="block font-display text-2xl font-extrabold">It&apos;s on us.</span>
              <span className="text-sm font-semibold">Chai Chowk was 1m 12s late — Rs 1,500 off</span>
            </span>
          </div>
        </div>
      </section>

      {/* Fine print */}
      <section id="fine-print" className="scroll-mt-20 bg-card py-20">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="font-display text-4xl font-extrabold">The fine print, in plain words</h2>
          <dl className="mt-8 grid gap-4 sm:grid-cols-2">
            {[
              ["Where the clock stops", `When your rider reaches your gate — within ${site.geofenceM} m of your pin. Chatting with the chowkidar doesn't count against us.`],
              ["What's free", `The whole order, up to ${rs(site.freeCapPkr)}. Above that, you pay only the difference.`],
              ["Rain Mode", "In heavy rain the timer pauses app-wide. You'll see it — and an honest ETA — before you order."],
              ["Where we deliver", `${brand.area}, Phases 1–8, for the pilot.`],
              ["How you pay", "Cash on delivery. Digital wallets and cards are on the way."],
              ["If a kitchen can't take it", "You're told within 2 minutes and never charged."],
            ].map(([k, v]) => (
              <div key={k} className="rounded-3xl bg-cream p-5">
                <dt className="font-display text-lg font-bold">{k}</dt>
                <dd className="mt-1 text-sm text-ink-soft">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Kitchens */}
      <section className="mx-auto max-w-6xl px-5 py-20 text-center">
        <h2 className="font-display text-4xl font-extrabold">{site.kitchens} kitchens. Three DHA hubs. All fast-lane.</h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-soft">We start small on purpose: kitchens close to you, menus that cook fast, riders who know the blocks.</p>
        <ul className="mt-8 flex flex-wrap justify-center gap-3">
          {site.clusters.map((c) => (
            <li key={c} className="flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-bold text-cream">
              <MapPin className="size-4 text-brand" /> {c}
            </li>
          ))}
        </ul>
        <ul className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
          {site.cuisines.map((c) => (
            <li key={c} className="rounded-full bg-card px-3 py-1.5 text-sm font-semibold shadow-soft">
              {c}
            </li>
          ))}
        </ul>
      </section>

      {/* Partners */}
      <section className="mx-auto grid max-w-6xl gap-5 px-5 md:grid-cols-2">
        <Link href="/restaurants/" className="group relative overflow-hidden rounded-[36px] bg-brand p-8 text-brand-ink">
          <ChefHat className="size-10" />
          <p className="mt-4 font-display text-3xl font-extrabold">Run a kitchen in DHA?</p>
          <p className="mt-2 max-w-md font-medium">A tablet dashboard, a loud order alarm, and a fair split clock — you&apos;re only charged when your own prep ran over.</p>
          <p className="mt-6 font-bold group-hover:underline">Partner with us →</p>
        </Link>
        <Link href="/riders/" className="group relative overflow-hidden rounded-[36px] bg-ink p-8 text-cream">
          <TruckArtPattern opacity={0.06} />
          <Bike className="relative size-10 text-brand" />
          <p className="relative mt-4 font-display text-3xl font-extrabold">Ride with WaqtPe</p>
          <p className="relative mt-2 max-w-md text-cream/80">No countdown on your screen. Fixed pay per job, never cut for lateness. Safety first, always.</p>
          <p className="relative mt-6 font-bold group-hover:underline">Join the fleet →</p>
        </Link>
      </section>

      {/* FAQ */}
      <section id="faq" className="mx-auto max-w-3xl scroll-mt-20 px-5 pt-20">
        <h2 className="font-display text-4xl font-extrabold">Questions</h2>
        <div className="mt-6 divide-y divide-line rounded-3xl bg-card shadow-soft">
          {FAQ.map((f) => (
            <details key={f.q} className="group px-6 py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold">
                {f.q}
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-muted transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-ink-soft">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto mt-20 max-w-6xl px-5">
        <div className="relative overflow-hidden rounded-[40px] bg-ink px-8 py-14 text-center text-cream">
          <TruckArtPattern opacity={0.08} />
          <Zap className="relative mx-auto size-8 fill-brand text-brand" aria-hidden />
          <p className="relative mt-3 font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight font-extrabold">Bhook lagi hai?</p>
          <p className="relative mt-2 text-cream/75">Your next order is racing a 30-minute clock.</p>
          <OrderButton className="relative mt-8 h-14 px-10 text-lg" />
        </div>
        <TruckArtStrip className="mt-6 rounded-full" />
      </section>
    </>
  );
}
