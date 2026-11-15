import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MapPin } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { JsonLd, breadcrumbLd, serviceLd } from "@/components/seo";
import { ClosingCta, OrderButton } from "@/components/site-chrome";
import { AREAS, areaPath } from "@/config/areas";
import { brand } from "@/config/brand";
import { phaseList, site } from "@/config/site";

const trail = [{ name: "Where we deliver", path: "/food-delivery/" }];
const description = `${brand.name} delivers food in DHA Lahore ${phaseList} from two kitchen hubs. See how each phase is served and what the 30-minute guarantee covers.`;

export const metadata: Metadata = {
  title: `Food delivery areas in DHA Lahore (${phaseList})`,
  description,
  alternates: { canonical: "/food-delivery/" },
  openGraph: { url: "/food-delivery/", title: `Where ${brand.name} delivers in DHA Lahore`, description },
};

export default function AreasPage() {
  return (
    <>
      <JsonLd data={[breadcrumbLd(trail), serviceLd(undefined, "/food-delivery/")]} />
      <PageHero
        trail={trail}
        eyebrow="Where we deliver"
        title={`Food delivery in DHA Lahore ${phaseList}`}
        intro="Three phases, two kitchen hubs, one promise. We keep the zone small so every order we accept can reach your gate inside 30 minutes."
      >
        <OrderButton className="h-14 px-8 text-lg" />
      </PageHero>

      <section className="mx-auto max-w-6xl px-5 py-20">
        <ul className="grid gap-5 md:grid-cols-3">
          {AREAS.map((a) => (
            <li key={a.slug}>
              <Link href={areaPath(a)} className="group flex h-full flex-col rounded-3xl bg-card p-6 shadow-soft">
                <span className="grid size-12 place-items-center rounded-2xl bg-ink text-brand">
                  <MapPin className="size-6" aria-hidden />
                </span>
                <h2 className="mt-4 font-display text-2xl font-extrabold">{a.name}</h2>
                <p className="mt-1 text-sm font-bold text-brand-deep">Cooked at: {a.hub}</p>
                <p className="mt-3 flex-1 text-sm text-ink-soft">{a.summary}</p>
                <p className="mt-4 inline-flex items-center gap-2 font-bold text-brand-deep group-hover:underline">
                  Food delivery in {a.name} <ArrowRight className="size-4" aria-hidden />
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <div className="mt-14 grid gap-8 rounded-[36px] bg-card p-8 shadow-soft md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-extrabold">How we decide what you can order</h2>
            <p className="mt-3 text-ink-soft">
              Your phase gets you into the zone. Your exact pin decides the rest. For every kitchen, the app adds up the cooking time, the rider&apos;s trip to
              the counter and the ride to your gate. A kitchen only shows up if that fits inside 30 minutes with time to spare.
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl font-extrabold">Not in DHA {phaseList}?</h2>
            <p className="mt-3 text-ink-soft">
              We grow one phase at a time, and only after the promise holds where we already are. Message us on{" "}
              <a href={`https://wa.me/${site.whatsapp}`} className="font-bold text-brand-deep underline underline-offset-4">
                WhatsApp
              </a>{" "}
              with your area. The areas with the most requests come next.
            </p>
          </div>
        </div>
      </section>
      <ClosingCta />
    </>
  );
}
