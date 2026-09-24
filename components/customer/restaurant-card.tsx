import Link from "next/link";
import { Clock, Star, Zap, CloudRain } from "lucide-react";
import { FoodArt } from "@/components/brand/food-art";
import type { RestaurantCardView } from "@/lib/server/catalog";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function RestaurantCard({ r, priority = false }: { r: RestaurantCardView; priority?: boolean }) {
  const q = r.quote;
  return (
    <Link
      href={`/r/${r.slug}`}
      className="group block rounded-[26px] bg-card p-2 shadow-soft transition-transform active:scale-[0.985]"
      prefetch={priority}
    >
      <div className="relative">
        <FoodArt
          emoji={r.heroEmoji}
          from={r.heroFrom}
          to={r.heroTo}
          imageUrl={r.heroImageUrl}
          alt={r.name}
          className={cn("aspect-[16/9] rounded-[20px]", !q.ok && "grayscale-[0.85]")}
          size="lg"
        />
        {q.ok ? (
          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <span className="tabular flex items-center gap-1 rounded-full bg-card/95 px-2.5 py-1 text-sm font-extrabold text-ink shadow-soft backdrop-blur">
              <Clock className="size-3.5" /> {t.home.etaMin(q.etaMin)}
            </span>
            {q.guarantee === "active" ? (
              <span className="flex items-center gap-1 rounded-full bg-ink/90 px-2.5 py-1 text-xs font-bold text-cream backdrop-blur">
                <Zap className="size-3.5 fill-brand text-brand" /> {t.home.guaranteed.replace("⚡", "")}
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-ink/80 px-2.5 py-1 text-xs font-bold text-cream">
                <CloudRain className="size-3.5" /> {t.home.noTimer}
              </span>
            )}
          </div>
        ) : (
          <div className="absolute inset-x-2.5 bottom-2.5 rounded-2xl bg-ink/85 px-3 py-2 text-[13px] leading-snug font-semibold text-cream backdrop-blur">
            {q.message}
          </div>
        )}
      </div>
      <div className="flex items-start justify-between gap-3 px-2 pt-2.5 pb-1.5">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[19px] font-bold">{r.name}</h3>
          <p className="truncate text-sm text-ink-soft">
            {r.cuisines.join(" · ")} · {r.cluster}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs font-bold">
          <Star className="size-3.5 fill-amber text-amber" />
          {r.rating.toFixed(1)}
        </span>
      </div>
    </Link>
  );
}
