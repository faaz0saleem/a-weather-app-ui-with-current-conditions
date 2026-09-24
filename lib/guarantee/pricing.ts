import { z } from "zod";
import type { GuaranteeSettings } from "./settings";

/** Shape of `menu_items.option_groups` (D13). */
export const optionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  price_pkr: z.number().int().min(0),
});
export const optionGroupSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  min: z.number().int().min(0),
  max: z.number().int().min(1),
  options: z.array(optionSchema).min(1),
});
export const optionGroupsSchema = z.array(optionGroupSchema);

export type MenuOption = z.infer<typeof optionSchema>;
export type OptionGroup = z.infer<typeof optionGroupSchema>;

export type PricingMenuItem = {
  id: string;
  restaurant_id: string;
  name: string;
  emoji: string;
  price_pkr: number;
  prep_min: number;
  option_groups: unknown;
  is_available: boolean;
  is_active: boolean;
};

export type CartLineInput = {
  itemId: string;
  qty: number;
  /** groupId → chosen option ids */
  options: Record<string, string[]>;
};

export type PricedLine = {
  menu_item_id: string;
  name: string;
  emoji: string;
  unit_price_pkr: number;
  qty: number;
  options: { group: string; option: string; price_pkr: number }[];
  line_total_pkr: number;
  prep_min: number;
};

export type PricingError =
  | "empty_cart"
  | "item_unavailable"
  | "item_out_of_stock"
  | "item_not_fast_lane"
  | "bad_quantity"
  | "bad_options"
  | "mixed_restaurants";

export type PricedCart =
  | {
      ok: true;
      lines: PricedLine[];
      subtotalPkr: number;
      deliveryFeePkr: number;
      totalPkr: number;
      maxPrepMin: number;
    }
  | { ok: false; code: PricingError; itemId?: string };

export const MAX_QTY = 20;

/** Rule 8: only fast-lane items can be sold. */
export function isFastLane(prepMin: number, s: Pick<GuaranteeSettings, "fastLaneMaxPrepMin">): boolean {
  return prepMin <= s.fastLaneMaxPrepMin;
}

export function parseOptionGroups(raw: unknown): OptionGroup[] {
  const parsed = optionGroupsSchema.safeParse(raw);
  return parsed.success ? parsed.data : [];
}

/** Price one line. Server-side only: prices always come from the live menu. */
export function priceLine(
  item: PricingMenuItem,
  line: CartLineInput,
): { ok: true; line: PricedLine } | { ok: false; code: PricingError } {
  if (!Number.isInteger(line.qty) || line.qty < 1 || line.qty > MAX_QTY) return { ok: false, code: "bad_quantity" };

  const groups = parseOptionGroups(item.option_groups);
  const chosen: PricedLine["options"] = [];

  for (const g of groups) {
    const picked = Array.from(new Set(line.options?.[g.id] ?? []));
    if (picked.length < g.min || picked.length > g.max) return { ok: false, code: "bad_options" };
    for (const optId of picked) {
      const opt = g.options.find((o) => o.id === optId);
      if (!opt) return { ok: false, code: "bad_options" };
      chosen.push({ group: g.name, option: opt.name, price_pkr: opt.price_pkr });
    }
  }
  // Reject options for groups that don't exist.
  for (const gid of Object.keys(line.options ?? {})) {
    if ((line.options[gid]?.length ?? 0) > 0 && !groups.some((g) => g.id === gid)) return { ok: false, code: "bad_options" };
  }

  const unit = item.price_pkr + chosen.reduce((sum, o) => sum + o.price_pkr, 0);
  return {
    ok: true,
    line: {
      menu_item_id: item.id,
      name: item.name,
      emoji: item.emoji,
      unit_price_pkr: unit,
      qty: line.qty,
      options: chosen,
      line_total_pkr: unit * line.qty,
      prep_min: item.prep_min,
    },
  };
}

export function priceCart(
  restaurantId: string,
  lines: CartLineInput[],
  menu: PricingMenuItem[],
  s: Pick<GuaranteeSettings, "fastLaneMaxPrepMin" | "deliveryFeePkr">,
): PricedCart {
  if (lines.length === 0) return { ok: false, code: "empty_cart" };
  const byId = new Map(menu.map((m) => [m.id, m]));
  const priced: PricedLine[] = [];

  for (const line of lines) {
    const item = byId.get(line.itemId);
    if (!item || !item.is_active) return { ok: false, code: "item_unavailable", itemId: line.itemId };
    if (item.restaurant_id !== restaurantId) return { ok: false, code: "mixed_restaurants", itemId: line.itemId };
    if (!item.is_available) return { ok: false, code: "item_out_of_stock", itemId: line.itemId };
    if (!isFastLane(item.prep_min, s)) return { ok: false, code: "item_not_fast_lane", itemId: line.itemId };
    const r = priceLine(item, line);
    if (!r.ok) return { ok: false, code: r.code, itemId: line.itemId };
    priced.push(r.line);
  }

  const subtotalPkr = priced.reduce((sum, l) => sum + l.line_total_pkr, 0);
  return {
    ok: true,
    lines: priced,
    subtotalPkr,
    deliveryFeePkr: s.deliveryFeePkr,
    totalPkr: subtotalPkr + s.deliveryFeePkr,
    maxPrepMin: Math.max(...priced.map((l) => l.prep_min)),
  };
}
