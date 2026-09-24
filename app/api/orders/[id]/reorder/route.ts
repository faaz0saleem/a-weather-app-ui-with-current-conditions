import { getServiceSupabase } from "@/lib/supabase/service";
import { parseOptionGroups } from "@/lib/guarantee/pricing";
import { requireViewer } from "@/lib/server/auth";
import { getSettings } from "@/lib/server/dispatch";
import { json, notFound, route } from "@/lib/server/http";

type SavedOption = { group_id?: string; option_id?: string; group?: string; option?: string };

/** Rebuild a cart from a past order against TODAY's menu (skips anything no longer sellable). */
export const POST = route(async (_req: Request, ctx: RouteContext<"/api/orders/[id]/reorder">) => {
  const viewer = await requireViewer();
  const { id } = await ctx.params;
  const sb = getServiceSupabase();
  const { data: o } = await sb
    .from("orders")
    .select("customer_id, restaurants(id, slug, name), order_items(menu_item_id, qty, options)")
    .eq("id", id)
    .maybeSingle();
  if (!o || o.customer_id !== viewer.id || !o.restaurants) throw notFound("Order not found");
  const s = await getSettings();
  const ids = (o.order_items ?? []).map((i) => i.menu_item_id).filter((x): x is string => !!x);
  const { data: menu } = await sb.from("menu_items").select("*").in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);

  const lines = [];
  let skipped = 0;
  for (const oi of o.order_items ?? []) {
    const item = menu?.find((m) => m.id === oi.menu_item_id);
    if (!item || !item.is_active || !item.is_available || item.prep_min > s.fastLaneMaxPrepMin) {
      skipped++;
      continue;
    }
    const groups = parseOptionGroups(item.option_groups);
    const saved = (Array.isArray(oi.options) ? oi.options : []) as SavedOption[];
    const options: Record<string, string[]> = {};
    const labels: string[] = [];
    let unit = item.price_pkr;
    for (const g of groups) {
      const picks = saved
        .filter((x) => x.group_id === g.id || (!x.group_id && x.group === g.name))
        .map((x) => g.options.find((op) => op.id === x.option_id || op.name === x.option))
        .filter((op): op is NonNullable<typeof op> => !!op);
      const chosen = picks.length ? picks : g.min > 0 ? [g.options[0]] : [];
      options[g.id] = chosen.map((c) => c.id);
      chosen.forEach((c) => {
        labels.push(c.name);
        unit += c.price_pkr;
      });
    }
    lines.push({ itemId: item.id, name: item.name, emoji: item.emoji, qty: oi.qty, options, optionLabels: labels, unitPricePkr: unit, prepMin: item.prep_min });
  }
  return json({
    cart: { restaurantId: o.restaurants.id, restaurantSlug: o.restaurants.slug, restaurantName: o.restaurants.name, lines },
    skipped,
  });
});
