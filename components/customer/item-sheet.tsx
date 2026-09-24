"use client";

import { useMemo, useState } from "react";
import { Check, Minus, Plus } from "lucide-react";
import { FoodArt } from "@/components/brand/food-art";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import type { CartLine } from "@/lib/client/cart";
import { formatPKR } from "@/lib/format";
import { t } from "@/lib/i18n";
import type { MenuItemView } from "@/lib/server/catalog";
import { cn } from "@/lib/utils";

/** Item bottom sheet: options/add-ons (Half/Full, extra raita), quantity, add. */
export function ItemSheet({
  item,
  gradient,
  onClose,
  onAdd,
}: {
  item: MenuItemView | null;
  gradient: [string, string];
  onClose: () => void;
  onAdd: (line: Omit<CartLine, "key">) => void;
}) {
  return (
    <Drawer open={!!item} onOpenChange={(o) => !o && onClose()}>
      <DrawerContent>
        {item && <ItemSheetBody key={item.id} item={item} gradient={gradient} onAdd={onAdd} />}
      </DrawerContent>
    </Drawer>
  );
}

function ItemSheetBody({
  item,
  gradient,
  onAdd,
}: {
  item: MenuItemView;
  gradient: [string, string];
  onAdd: (line: Omit<CartLine, "key">) => void;
}) {
  // Pre-select the first choice of required single-choice groups.
  const [picked, setPicked] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(item.optionGroups.map((g) => [g.id, g.min === 1 && g.max === 1 ? [g.options[0].id] : []])),
  );
  const [qty, setQty] = useState(1);

  const unit = useMemo(() => {
    let p = item.pricePkr;
    item.optionGroups.forEach((g) => (picked[g.id] ?? []).forEach((id) => (p += g.options.find((o) => o.id === id)?.price_pkr ?? 0)));
    return p;
  }, [item, picked]);

  const valid = item.optionGroups.every((g) => {
    const n = picked[g.id]?.length ?? 0;
    return n >= g.min && n <= g.max;
  });

  function toggle(groupId: string, optionId: string, single: boolean, max: number) {
    setPicked((cur) => {
      const list = cur[groupId] ?? [];
      if (single) return { ...cur, [groupId]: [optionId] };
      if (list.includes(optionId)) return { ...cur, [groupId]: list.filter((x) => x !== optionId) };
      if (list.length >= max) return cur;
      return { ...cur, [groupId]: [...list, optionId] };
    });
  }

  function submit() {
    if (!valid) return;
    const labels = item.optionGroups.flatMap((g) => (picked[g.id] ?? []).map((id) => g.options.find((o) => o.id === id)?.name ?? ""));
    onAdd({ itemId: item.id, name: item.name, emoji: item.emoji, qty, options: picked, optionLabels: labels.filter(Boolean), unitPricePkr: unit, prepMin: item.prepMin });
  }

  return (
    <>
            <div className="overflow-y-auto px-5 pb-4">
              <FoodArt emoji={item.emoji} from={gradient[0]} to={gradient[1]} imageUrl={item.imageUrl} alt={item.name} size="lg" className="mt-2 h-44 rounded-3xl" />
              <DrawerTitle className="mt-4 text-2xl">{item.name}</DrawerTitle>
              <DrawerDescription className="mt-1">{item.description || t.restaurant.prep(item.prepMin)}</DrawerDescription>
              <p className="tabular mt-2 font-display text-lg font-bold">{formatPKR(item.pricePkr)}</p>

              {item.optionGroups.map((g) => {
                const single = g.max === 1;
                const hint = g.min > 0 ? (single ? t.item.chooseOne : t.item.chooseBetween(g.min, g.max)) : t.item.chooseUpTo(g.max);
                return (
                  <fieldset key={g.id} className="mt-5">
                    <legend className="mb-2 flex w-full items-center justify-between">
                      <span className="font-bold">{g.name}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-xs font-bold", g.min > 0 ? "bg-brand-soft text-ink" : "bg-muted text-ink-soft")}>
                        {g.min > 0 ? t.item.required : t.item.optional} · {hint}
                      </span>
                    </legend>
                    <div className="space-y-2">
                      {g.options.map((o) => {
                        const on = picked[g.id]?.includes(o.id) ?? false;
                        return (
                          <button
                            key={o.id}
                            type="button"
                            role={single ? "radio" : "checkbox"}
                            aria-checked={on}
                            onClick={() => toggle(g.id, o.id, single, g.max)}
                            className={cn(
                              "flex h-13 w-full items-center gap-3 rounded-2xl border px-4 text-left transition-colors",
                              on ? "border-brand bg-brand-soft/50" : "border-line bg-cream",
                            )}
                          >
                            <span
                              className={cn(
                                "grid size-6 place-items-center border-2 transition-colors",
                                single ? "rounded-full" : "rounded-lg",
                                on ? "border-brand bg-brand text-brand-ink" : "border-line",
                              )}
                            >
                              {on && <Check className="size-4" strokeWidth={3} />}
                            </span>
                            <span className="flex-1 font-semibold">{o.name}</span>
                            {o.price_pkr > 0 && <span className="tabular text-sm text-ink-soft">+{formatPKR(o.price_pkr)}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                );
              })}
            </div>
            <div className="safe-bottom flex items-center gap-3 border-t border-line px-5 pt-3">
              <div className="flex items-center gap-1 rounded-2xl bg-muted p-1">
                <button aria-label="Less" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid size-10 place-items-center rounded-xl hover:bg-card">
                  <Minus className="size-4" />
                </button>
                <span className="tabular w-7 text-center font-display text-lg font-bold" aria-live="polite">
                  {qty}
                </span>
                <button aria-label="More" onClick={() => setQty((q) => Math.min(20, q + 1))} className="grid size-10 place-items-center rounded-xl hover:bg-card">
                  <Plus className="size-4" />
                </button>
              </div>
              <Button size="lg" className="flex-1" disabled={!valid} onClick={submit}>
                {t.item.addToCart(unit * qty)}
              </Button>
            </div>
    </>
  );
}
