import Link from "next/link";
import { ArrowRight, BellRing } from "lucide-react";
import { AREAS, areaPath } from "@/config/areas";
import { brand } from "@/config/brand";
import { phaseList, site } from "@/config/site";
import { Logo, TruckArtStrip } from "./brand";

const alertText = `Salam! Tell me when ${brand.name} starts delivering in DHA ${phaseList}.`;
export const launchAlertUrl = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(alertText)}`;

/**
 * The main button. Once orders are open it goes to the app; before launch it
 * collects launch alerts on WhatsApp, so nobody lands on an app that can't take an order.
 */
export function OrderButton({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <a
      href={site.launched ? site.appUrl : launchAlertUrl}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-6 font-bold text-brand-ink shadow-[0_10px_24px_-12px_var(--wp-brand)] transition-transform hover:brightness-105 active:scale-[0.97] ${className}`}
    >
      {children ?? (site.launched ? (
        <>
          Order now <ArrowRight className="size-5" aria-hidden />
        </>
      ) : (
        <>
          <BellRing className="size-5" aria-hidden /> Get the launch alert
        </>
      ))}
    </a>
  );
}

const NAV = [
  { href: "/guarantee/", label: "The guarantee" },
  { href: "/food-delivery/", label: "Where we deliver" },
  { href: "/restaurants/", label: "For restaurants" },
  { href: "/riders/", label: "Ride with us" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" aria-label={`${brand.name} home`}>
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-semibold text-ink-soft md:flex">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className="hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <OrderButton className="h-11 px-4 text-sm">{site.launched ? "Order now" : "Launch alert"}</OrderButton>
      </div>
      {/* Phones: the same links in one scrollable row, so every page is one tap away */}
      <nav aria-label="Main" className="flex gap-5 overflow-x-auto border-t border-line/60 px-5 py-2.5 text-sm font-semibold whitespace-nowrap text-ink-soft md:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className="hover:text-ink">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <TruckArtStrip />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 sm:grid-cols-2 md:grid-cols-5">
        <div className="sm:col-span-2">
          <Logo className="text-cream" />
          <p className="mt-3 max-w-sm font-display text-2xl font-bold">{brand.tagline}</p>
          <p className="mt-2 max-w-sm text-sm text-cream/70">
            Food delivery in DHA Lahore {phaseList}, from {site.kitchens} fast kitchens. Cash on delivery.
          </p>
        </div>
        <FooterList title={brand.name}>
          <li><Link href="/guarantee/" className="hover:text-brand">The 30-minute guarantee</Link></li>
          <li><Link href="/faq/" className="hover:text-brand">Questions</Link></li>
          <li><Link href="/restaurants/" className="hover:text-brand">Partner with us</Link></li>
          <li><Link href="/riders/" className="hover:text-brand">Ride with us</Link></li>
        </FooterList>
        <FooterList title="Where we deliver">
          {AREAS.map((a) => (
            <li key={a.slug}><Link href={areaPath(a)} className="hover:text-brand">{a.name}</Link></li>
          ))}
          <li><Link href="/food-delivery/" className="hover:text-brand">All areas</Link></li>
        </FooterList>
        <FooterList title="Contact">
          <li><a href={`https://wa.me/${site.whatsapp}`} className="hover:text-brand">WhatsApp {brand.supportPhone}</a></li>
          <li><a href={`mailto:${site.email}`} className="hover:text-brand">{site.email}</a></li>
          <li><Link href="/privacy/" className="hover:text-brand">Privacy</Link> · <Link href="/terms/" className="hover:text-brand">Terms</Link></li>
        </FooterList>
      </div>
      <p className="border-t border-cream/10 px-5 py-5 text-center text-xs text-cream/60">© {new Date().getFullYear()} {brand.name} · Made in Lahore</p>
    </footer>
  );
}

function FooterList({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-3 text-xs font-bold tracking-wider text-cream/60 uppercase">{title}</p>
      <ul className="space-y-2 text-sm">{children}</ul>
    </div>
  );
}

/** Closing call to action shared by every page. */
export function ClosingCta({ title = "Bhook lagi hai?", body = "Your next order races a 30-minute clock." }: { title?: string; body?: string }) {
  return (
    <section className="mx-auto mt-20 max-w-6xl px-5">
      <div className="relative overflow-hidden rounded-[40px] bg-ink px-8 py-14 text-center text-cream">
        <p className="relative font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight font-extrabold">{title}</p>
        <p className="relative mx-auto mt-2 max-w-xl text-cream/75">{body}</p>
        <OrderButton className="relative mt-8 h-14 px-10 text-lg" />
      </div>
      <TruckArtStrip className="mt-6 rounded-full" />
    </section>
  );
}

export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  return (
    <div className="divide-y divide-line rounded-3xl bg-card shadow-soft">
      {items.map((f) => (
        <details key={f.q} className="group px-6 py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg font-bold">
            {f.q}
            <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-full bg-muted transition-transform group-open:rotate-45">+</span>
          </summary>
          <p className="mt-3 text-ink-soft">{f.a}</p>
        </details>
      ))}
    </div>
  );
}
