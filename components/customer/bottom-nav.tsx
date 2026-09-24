"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ReceiptText, UserRound } from "lucide-react";
import { motion } from "motion/react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: t.nav.home, icon: House },
  { href: "/orders", label: t.nav.orders, icon: ReceiptText },
  { href: "/profile", label: t.nav.profile, icon: UserRound },
] as const;

/** One-thumb bottom navigation. Only on the three top-level customer screens. */
export function BottomNav() {
  const pathname = usePathname();
  if (!TABS.some((tab) => tab.href === pathname)) return null;
  return (
    <>
      <div aria-hidden className="h-24" />
      <nav
        aria-label="Main"
        className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto w-full max-w-md border-t border-line/70 bg-card/90 px-6 pt-2 backdrop-blur-xl"
      >
        <ul className="flex items-center justify-between">
          {TABS.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href} className="flex-1">
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative mx-auto flex h-14 w-20 flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-bold transition-colors",
                    active ? "text-ink" : "text-ink-soft",
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-x-3 top-1 h-8 rounded-full bg-brand-soft"
                      transition={{ type: "spring", stiffness: 500, damping: 40 }}
                    />
                  )}
                  <Icon className="relative size-5" strokeWidth={active ? 2.5 : 2} />
                  <span className="relative">{label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
