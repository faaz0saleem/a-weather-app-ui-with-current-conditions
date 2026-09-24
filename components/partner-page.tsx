import type { LucideIcon } from "lucide-react";
import { MessageCircle, Phone } from "lucide-react";
import { TruckArtPattern } from "@/components/brand";
import { brand } from "@/config/brand";
import { site } from "@/config/site";

export function PartnerPage({
  eyebrow,
  title,
  intro,
  points,
  steps,
  whatsappText,
  dark = false,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  points: { icon: LucideIcon; title: string; body: string }[];
  steps: string[];
  whatsappText: string;
  dark?: boolean;
}) {
  return (
    <>
      <section className={`relative overflow-hidden ${dark ? "bg-ink text-cream" : "bg-brand text-brand-ink"}`}>
        {dark && <TruckArtPattern opacity={0.07} />}
        <div className="relative mx-auto max-w-6xl px-5 py-20">
          <p className="text-sm font-bold tracking-wider uppercase opacity-80">{eyebrow}</p>
          <h1 className="mt-3 max-w-3xl font-display text-[clamp(2.4rem,6vw,4.4rem)] leading-[0.98] font-extrabold">{title}</h1>
          <p className="mt-5 max-w-2xl text-lg opacity-85">{intro}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(whatsappText)}`}
              className={`inline-flex h-14 items-center gap-2 rounded-2xl px-7 text-lg font-bold ${dark ? "bg-brand text-brand-ink" : "bg-ink text-cream"}`}
            >
              <MessageCircle className="size-5" /> WhatsApp us
            </a>
            <a href={`tel:${brand.supportPhone.replace(/\s/g, "")}`} className="inline-flex h-14 items-center gap-2 rounded-2xl border border-current/30 px-6 font-bold">
              <Phone className="size-5" /> {brand.supportPhone}
            </a>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-20">
        <ul className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {points.map((p) => (
            <li key={p.title} className="rounded-3xl bg-card p-6 shadow-soft">
              <span className="grid size-12 place-items-center rounded-2xl bg-ink text-brand">
                <p.icon className="size-6" />
              </span>
              <h2 className="mt-4 font-display text-xl font-bold">{p.title}</h2>
              <p className="mt-2 text-sm text-ink-soft">{p.body}</p>
            </li>
          ))}
        </ul>
        <div className="mt-14 rounded-[36px] bg-card p-8 shadow-soft">
          <h2 className="font-display text-3xl font-extrabold">How to join</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {steps.map((s, i) => (
              <li key={s} className="flex gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand font-display text-lg font-extrabold text-brand-ink">{i + 1}</span>
                <p className="pt-1.5 font-medium">{s}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
