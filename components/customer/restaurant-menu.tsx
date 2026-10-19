"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Clock, Flame, Plus, Star, Zap } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { FoodArt } from "@/components/brand/food-art";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cartCount, cartStore, cartSubtotal, useCart, type CartLine } from "@/lib/client/cart";
import { formatPKR } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { MenuItemView, RestaurantPageView } from "@/lib/server/catalog";
import { cn, haptic } from "@/lib/utils";
import { ItemSheet } from "./item-sheet";

export function RestaurantMenu({ restaurant: r }: { restaurant: RestaurantPageView; fastLaneMax: number }) {
  const [openItem, setOpenItem] = useState<MenuItemView | null>(null);
  const [pending, setPending] = useState<Omit<CartLine, "key"> | null>(null);
  const [activeSection, setActiveSection] = useState(r.sections[0]?.id);
  const [bump, setBump] = useState(0);
  const cart = useCart();
  const router = useRouter();
  const chipsRef = useRef<HTMLDivElement>(null);

  const mine = cart?.restaurantId === r.id ? cart : null;
  const count = cartCount(mine);

  // Scroll-spy for the sticky section chips.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id.replace("sec-", ""));
      },
      { rootMargin: "-120px 0px -60% 0px" },
    );
    r.sections.forEach((s) => {
      const el = document.getElementById(`sec-${s.id}`);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, [r.sections]);

  useEffect(() => {
    chipsRef.current?.querySelector(`[data-sec="${activeSection}"]`)?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
  }, [activeSection]);

  function add(line: Omit<CartLine, "key">, replace = false) {
    const ok = cartStore.add({ id: r.id, slug: r.slug, name: r.name }, line, { replace });
    if (!ok) {
      setPending(line);
      return;
    }
    haptic(15);
    setBump((b) => b + 1);
    setOpenItem(null);
    setPending(null);
  }

  function quickAdd(item: MenuItemView) {
    if (item.optionGroups.some((g) => g.min > 0)) return setOpenItem(item);
    add({ itemId: item.id, name: item.name, emoji: item.emoji, qty: 1, options: {}, optionLabels: [], unitPricePkr: item.pricePkr, prepMin: item.prepMin });
  }

  const q = r.quote;

  return (
    <div className="pb-32">
      {/* Hero */}
      <div className="relative">
        <FoodArt emoji={r.heroEmoji} from={r.heroFrom} to={r.heroTo} imageUrl={r.heroImageUrl} alt={r.name} size="xl" className="h-64" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/70 to-transparent" />
        <Link
          href="/"
          aria-label={t.common.back}
          className="absolute top-[max(env(safe-area-inset-top),1rem)] left-4 grid size-11 place-items-center rounded-full bg-card/90 text-ink shadow-soft backdrop-blur"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="absolute inset-x-5 bottom-4 text-white">
          <h1 className="font-display text-[32px] leading-none font-extrabold drop-shadow">{r.name}</h1>
          <p className="mt-1 text-sm text-white/85">{r.tagline}</p>
        </div>
      </div>

      {/* Facts */}
      <div className="-mt-3 rounded-t-3xl bg-cream px-5 pt-4">
        <div className="flex flex-wrap items-center gap-2 text-sm font-semibold">
          <span className="flex items-center gap-1 rounded-full bg-card px-3 py-1.5 shadow-soft">
            <Star className="size-4 fill-amber text-amber" /> {t.common.rating(r.rating, r.ratingCount)}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-card px-3 py-1.5 shadow-soft">
            <Flame className="size-4 text-brand" /> {t.restaurant.prep(r.typicalPrepMin)}
          </span>
          {q.ok && (
            <span className="tabular flex items-center gap-1 rounded-full bg-ink px-3 py-1.5 text-cream">
              <Clock className="size-4" /> {t.restaurant.etaToYou(q.etaMin)}
            </span>
          )}
          {q.ok && q.guarantee === "active" && (
            <span className="flex items-center gap-1 rounded-full bg-brand px-3 py-1.5 font-bold text-brand-ink">
              <Zap className="size-4 fill-current" /> 30
            </span>
          )}
        </div>
        {!q.ok && (
          <div role="status" className="mt-3 rounded-2xl bg-chili/10 px-4 py-3 text-sm font-semibold text-chili-deep">
            {q.message}
          </div>
        )}
        <p className="mt-3 text-[13px] leading-snug text-ink-soft">{t.restaurant.fastLaneNote}</p>
      </div>

      {/* Sticky section chips */}
      <div className="sticky top-0 z-20 mt-3 bg-cream/95 py-2 backdrop-blur-md">
        <div ref={chipsRef} className="no-scrollbar flex gap-2 overflow-x-auto px-5">
          {r.sections.map((s) => (
            <button
              key={s.id}
              data-sec={s.id}
              onClick={() => document.getElementById(`sec-${s.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" })}
              className={cn(
                "h-9 shrink-0 rounded-full px-4 text-sm font-bold transition-colors",
                activeSection === s.id ? "bg-ink text-cream" : "bg-card text-ink-soft shadow-soft",
              )}
            >
              {s.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div className="px-5">
        {r.sections.map((s) => (
          <section key={s.id} id={`sec-${s.id}`} className="scroll-mt-16 pt-5">
            <h2 className="mb-3 font-display text-xl font-bold">{s.name}</h2>
            <ul className="space-y-3">
              {s.items.map((item) => (
                <li key={item.id}>
                  <MenuRow item={item} gradient={[r.heroFrom, r.heroTo]} onOpen={() => setOpenItem(item)} onQuickAdd={() => quickAdd(item)} />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <ItemSheet item={openItem} gradient={[r.heroFrom, r.heroTo]} onClose={() => setOpenItem(null)} onAdd={(line) => add(line)} />

      {/* Replace-cart confirm */}
      <Dialog open={!!pending} onOpenChange={(o) => !o && setPending(null)}>
        <DialogContent>
          <DialogTitle>{t.item.replaceCartTitle}</DialogTitle>
          <DialogDescription>{t.item.replaceCartBody(cart?.restaurantName ?? "")}</DialogDescription>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setPending(null)}>
              {t.common.cancel}
            </Button>
            <Button className="flex-1" onClick={() => pending && add(pending, true)}>
              {t.item.replaceCart}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Sticky cart bar */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            initial={{ y: 120 }}
            animate={{ y: 0 }}
            exit={{ y: 120 }}
            transition={{ type: "spring", stiffness: 400, damping: 34 }}
            className="safe-bottom fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md px-4"
          >
            <motion.button
              key={bump}
              initial={{ scale: bump ? 0.96 : 1 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 600, damping: 15 }}
              onClick={() => router.push("/checkout")}
              className="flex h-16 w-full items-center gap-3 rounded-3xl bg-ink px-4 text-cream shadow-lift"
            >
              <span className="tabular grid size-9 place-items-center rounded-xl bg-brand font-display text-lg font-extrabold text-brand-ink">
                {count}
              </span>
              <span className="flex-1 text-left font-bold">{t.cart.viewCart}</span>
              <span className="tabular font-display text-lg font-bold">{formatPKR(cartSubtotal(mine))}</span>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuRow({
  item,
  gradient,
  onOpen,
  onQuickAdd,
}: {
  item: MenuItemView;
  gradient: [string, string];
  onOpen: () => void;
  onQuickAdd: () => void;
}) {
  const soldOut = !item.isAvailable;
  return (
    <div className={cn("flex gap-3 rounded-3xl bg-card p-3 shadow-soft", soldOut && "opacity-60")}>
      <button onClick={onOpen} disabled={soldOut} className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-2">
          <h3 className="font-bold leading-tight">{item.name}</h3>
          {item.isPopular && <Badge variant="soft">{t.restaurant.popular}</Badge>}
        </div>
        {item.description && <p className="mt-1 line-clamp-2 text-[13px] text-ink-soft">{item.description}</p>}
        <p className="tabular mt-2 font-display font-bold">
          {formatPKR(item.pricePkr)}
          {soldOut && <span className="ml-2 text-xs font-bold text-chili-deep uppercase">{t.restaurant.soldOut}</span>}
        </p>
      </button>
      <div className="relative shrink-0">
        <FoodArt emoji={item.emoji} from={gradient[0]} to={gradient[1]} imageUrl={item.imageUrl} alt={item.name} size="sm" className="size-24 rounded-2xl" />
        {!soldOut && (
          <button
            onClick={onQuickAdd}
            aria-label={`${t.restaurant.add} ${item.name}`}
            className="absolute -right-1.5 -bottom-1.5 grid size-10 place-items-center rounded-full bg-brand text-brand-ink shadow-lift active:scale-90"
          >
            <Plus className="size-5" strokeWidth={3} />
          </button>
        )}
      </div>
    </div>
  );
}
