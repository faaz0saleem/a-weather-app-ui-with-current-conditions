import { getServiceSupabase } from "@/lib/supabase/service";
import { getSettings } from "@/lib/server/dispatch";
import { dbError, json, readJson, route } from "@/lib/server/http";
import { kitchenContext } from "@/lib/server/kitchen-request";
import { menuItemSchema } from "@/lib/server/menu";

export const GET = route(async (req: Request) => {
  const { restaurant } = await kitchenContext(req);
  const sb = getServiceSupabase();
  const [sections, items, s] = await Promise.all([
    sb.from("menu_sections").select("*").eq("restaurant_id", restaurant.id).order("sort"),
    sb.from("menu_items").select("*").eq("restaurant_id", restaurant.id).eq("is_active", true).order("sort"),
    getSettings(),
  ]);
  return json({ sections: sections.data ?? [], items: items.data ?? [], fastLaneMaxPrepMin: s.fastLaneMaxPrepMin });
});

export const POST = route(async (req: Request) => {
  const { restaurant } = await kitchenContext(req);
  const input = menuItemSchema.parse(await readJson(req));
  const { data, error } = await getServiceSupabase()
    .from("menu_items")
    .insert({ ...input, restaurant_id: restaurant.id, sort: input.sort ?? 999 })
    .select("*")
    .single();
  if (error) throw dbError(error);
  return json({ item: data });
});
