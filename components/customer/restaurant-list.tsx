"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { EmptyState } from "@/components/customer/empty-state";
import type { RestaurantCardView } from "@/lib/server/catalog";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { RestaurantCard } from "./restaurant-card";

export function RestaurantList({ restaurants }: { restaurants: RestaurantCardView[] }) {
  const [cuisine, setCuisine] = useState<string | null>(null);
  const cuisines = useMemo(() => {
    const counts = new Map<string, number>();
    restaurants.forEach((r) => r.cuisines.forEach((c) => counts.set(c, (counts.get(c) ?? 0) + 1)));
    return [...counts.keys()];
  }, [restaurants]);
  const shown = cuisine ? restaurants.filter((r) => r.cuisines.includes(cuisine)) : restaurants;
  const openCount = restaurants.filter((r) => r.quote.ok).length;

  return (
    <section aria-labelledby="fastest">
      <div className="no-scrollbar -mx-5 mb-4 flex gap-2 overflow-x-auto px-5 pb-1" role="tablist" aria-label="Cuisines">
        {[null, ...cuisines].map((c) => {
          const active = cuisine === c;
          return (
            <button
              key={c ?? "all"}
              role="tab"
              aria-selected={active}
              onClick={() => setCuisine(c)}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-sm font-bold transition-colors",
                active ? "bg-ink text-cream" : "bg-card text-ink shadow-soft hover:bg-muted",
              )}
            >
              {c ?? t.home.all}
            </button>
          );
        })}
      </div>

      <h2 id="fastest" className="mb-3 font-display text-xl font-bold">
        {t.home.fastest}
      </h2>

      {openCount === 0 && !cuisine && (
        <div className="mb-4">
          <EmptyState emoji="🌙" title={t.home.noneOpen} body={t.home.noneOpenBody} />
        </div>
      )}

      <ul className="space-y-4">
        <AnimatePresence initial={false}>
          {shown.map((r, i) => (
            <motion.li
              key={r.id}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, delay: Math.min(i, 6) * 0.03 }}
            >
              <RestaurantCard r={r} priority={i < 3} />
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </section>
  );
}
