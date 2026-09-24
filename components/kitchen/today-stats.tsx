"use client";

import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/client/api";
import { formatPKR } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { KitchenToday } from "@/lib/server/kitchen";
import { cn } from "@/lib/utils";

export function TodayStats({ query }: { query: string }) {
  const [d, setD] = useState<KitchenToday | null>(null);
  useEffect(() => {
    api<{ today: KitchenToday }>(`/api/restaurant/today${query}`)
      .then((r) => setD(r.today))
      .catch(() => {});
  }, [query]);
  if (!d)
    return (
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  const s = t.kitchen.today;
  const cards: { label: string; value: string; tone?: "good" | "bad" }[] = [
    { label: s.orders, value: String(d.orders) },
    { label: s.onTime, value: d.onTimePct == null ? "—" : `${d.onTimePct}%`, tone: d.onTimePct != null && d.onTimePct >= 90 ? "good" : undefined },
    { label: s.kitchenLates, value: String(d.kitchenLates), tone: d.kitchenLates > 0 ? "bad" : "good" },
    { label: s.charges, value: formatPKR(d.kitchenChargesPkr), tone: d.kitchenChargesPkr > 0 ? "bad" : undefined },
    { label: s.sales, value: formatPKR(d.salesPkr) },
    { label: s.avgPrep, value: d.avgPrepMin == null ? "—" : `${d.avgPrepMin} min` },
    { label: s.rejected, value: String(d.rejected) },
    { label: s.timeouts, value: String(d.timeouts), tone: d.timeouts > 0 ? "bad" : undefined },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {cards.map((c) => (
        <div key={c.label} className="rounded-3xl bg-card p-4 shadow-soft">
          <p className="text-xs font-bold tracking-wider text-ink-soft uppercase">{c.label}</p>
          <p className={cn("tabular mt-1 font-display text-3xl font-extrabold", c.tone === "good" && "text-mint-deep", c.tone === "bad" && "text-chili-deep")}>{c.value}</p>
        </div>
      ))}
    </div>
  );
}
