"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { formatClock } from "@/lib/format";
import { useServerNow } from "@/lib/client/server-clock";
import { t } from "@/lib/i18n";
import { timerTone, TONE_BG } from "@/lib/timer";
import type { ActiveOrderSummary } from "@/lib/server/customer-orders";
import { cn } from "@/lib/utils";

const STATUS: Record<ActiveOrderSummary["status"], string> = {
  placed: t.race.waitingAccept,
  accepted: t.race.cooking,
  ready: t.race.ready,
  picked_up: t.race.onTheWay,
  arrived: t.race.arrived,
};

/** "Your order · 18:42 left" pill on the home screen. */
export function ActiveOrderBanner({ order }: { order: ActiveOrderSummary }) {
  const now = useServerNow();
  const remaining = order.promisedBy ? (new Date(order.promisedBy).getTime() - now) / 1000 : null;
  const tone = timerTone(remaining, order.guaranteeState);
  return (
    <Link
      href={`/orders/${order.id}`}
      className="flex items-center gap-3 rounded-3xl bg-ink p-3 pr-4 text-cream shadow-lift active:scale-[0.99]"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-cream/10 text-2xl">{order.restaurantEmoji}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-bold">{order.restaurantName}</span>
        <span className="block truncate text-xs text-cream/70">{STATUS[order.status]}</span>
      </span>
      {remaining !== null && order.status !== "arrived" && (
        <span className={cn("tabular rounded-full px-2.5 py-1 font-display text-sm font-extrabold text-ink", TONE_BG[tone])}>
          {tone === "gold" ? t.common.free : formatClock(remaining)}
        </span>
      )}
      <ChevronRight className="size-5 shrink-0 text-cream/60" />
    </Link>
  );
}
