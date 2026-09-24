import Link from "next/link";
import { brand } from "@/config/brand";
import { site } from "@/config/site";
import { Logo, TruckArtStrip } from "./brand";

export function OrderButton({ className = "", children = "Order now" }: { className?: string; children?: React.ReactNode }) {
  return (
    <a
      href={site.appUrl}
      className={`inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-brand px-6 font-bold text-brand-ink shadow-[0_10px_24px_-12px_var(--wp-brand)] transition-transform hover:brightness-105 active:scale-[0.97] ${className}`}
    >
      {children}
    </a>
  );
}

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-cream/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" aria-label={`${brand.name} home`}>
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 text-sm font-semibold text-ink-soft md:flex">
          <Link href="/#how" className="hover:text-ink">How it works</Link>
          <Link href="/#fine-print" className="hover:text-ink">The fine print</Link>
          <Link href="/restaurants/" className="hover:text-ink">For restaurants</Link>
          <Link href="/riders/" className="hover:text-ink">Ride with us</Link>
        </nav>
        <OrderButton className="h-10 px-4 text-sm" />
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-ink text-cream">
      <TruckArtStrip />
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-4">
        <div className="md:col-span-2">
          <Logo className="text-cream" />
          <p className="mt-3 max-w-sm font-display text-2xl font-bold">{brand.tagline}</p>
          <p className="mt-2 text-sm text-cream/70">Food delivery in {brand.area}. Pilot with {site.kitchens} kitchens.</p>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold tracking-wider text-cream/60 uppercase">WaqtPe</p>
          <ul className="space-y-2 text-sm">
            <li><a href={site.appUrl} className="hover:text-brand">Order food</a></li>
            <li><Link href="/restaurants/" className="hover:text-brand">Partner with us</Link></li>
            <li><Link href="/riders/" className="hover:text-brand">Ride with us</Link></li>
            <li><Link href="/#faq" className="hover:text-brand">FAQ</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-bold tracking-wider text-cream/60 uppercase">Contact</p>
          <ul className="space-y-2 text-sm">
            <li><a href={`https://wa.me/${site.whatsapp}`} className="hover:text-brand">WhatsApp {brand.supportPhone}</a></li>
            <li><a href={`mailto:${site.email}`} className="hover:text-brand">{site.email}</a></li>
            <li><Link href="/privacy/" className="hover:text-brand">Privacy</Link> · <Link href="/terms/" className="hover:text-brand">Terms</Link></li>
          </ul>
        </div>
      </div>
      <p className="border-t border-cream/10 px-5 py-5 text-center text-xs text-cream/60">© {new Date().getFullYear()} {brand.name} · Made in Lahore</p>
    </footer>
  );
}
