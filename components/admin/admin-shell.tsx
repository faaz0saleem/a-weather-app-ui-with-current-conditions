"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bike, FlaskConical, Map, Radio, Settings, ShieldAlert, Store } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: t.admin.nav.live, icon: Radio },
  { href: "/admin/analytics", label: t.admin.nav.analytics, icon: BarChart3 },
  { href: "/admin/restaurants", label: t.admin.nav.restaurants, icon: Store },
  { href: "/admin/riders", label: t.admin.nav.riders, icon: Bike },
  { href: "/admin/reviews", label: t.admin.nav.reviews, icon: ShieldAlert },
  { href: "/admin/settings", label: t.admin.nav.settings, icon: Settings },
  { href: "/admin/zone", label: t.admin.nav.zone, icon: Map },
  { href: "/admin/sim", label: t.admin.nav.sim, icon: FlaskConical, dev: true },
];

export function AdminShell({ children, name, devTools }: { children: React.ReactNode; name: string; devTools: boolean }) {
  const pathname = usePathname();
  const items = NAV.filter((n) => !n.dev || devTools);
  return (
    <div className="min-h-dvh bg-cream md:flex">
      <aside className="sticky top-0 z-30 border-b border-line bg-card/95 backdrop-blur md:h-dvh md:w-60 md:shrink-0 md:border-r md:border-b-0">
        <div className="hidden items-center justify-between px-5 pt-5 pb-4 md:flex">
          <Logo />
        </div>
        <nav aria-label="Admin" className="no-scrollbar flex gap-1 overflow-x-auto px-3 py-2 md:flex-col md:overflow-visible md:py-0">
          {items.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors",
                  active ? "bg-ink text-cream" : "text-ink-soft hover:bg-muted hover:text-ink",
                )}
              >
                <Icon className="size-4" /> {label}
              </Link>
            );
          })}
        </nav>
        <div className="hidden px-5 py-4 text-xs text-ink-soft md:absolute md:bottom-0 md:block">
          {t.admin.title} · {name}
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}

export function AdminHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-extrabold">{title}</h1>
        {subtitle && <p className="text-sm text-ink-soft">{subtitle}</p>}
      </div>
      {right}
    </header>
  );
}
