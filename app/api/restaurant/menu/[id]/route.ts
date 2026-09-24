import { getServiceSupabase } from "@/lib/supabase/service";
import { badRequest, dbError, json, notFound, readJson, route } from "@/lib/server/http";
import { uploadImage } from "@/lib/server/kitchen";
import { kitchenContext } from "@/lib/server/kitchen-request";
import { menuItemSchema } from "@/lib/server/menu";

async function ownItem(restaurantId: string, id: string) {
  const { data } = await getServiceSupabase().from("menu_items").select("id, restaurant_id").eq("id", id).maybeSingle();
  if (!data || data.restaurant_id !== restaurantId) throw notFound("Item not found");
}

export const PATCH = route(async (req: Request, ctx: RouteContext<"/api/restaurant/menu/[id]">) => {
  const { restaurant } = await kitchenContext(req);
  const { id } = await ctx.params;
  await ownItem(restaurant.id, id);
  const input = menuItemSchema.partial().parse(await readJson(req));
  const { data, error } = await getServiceSupabase().from("menu_items").update(input).eq("id", id).select("*").single();
  if (error) throw dbError(error);
  return json({ item: data });
});

/** Upload a photo (multipart "photo"). */
export const POST = route(async (req: Request, ctx: RouteContext<"/api/restaurant/menu/[id]">) => {
  const { restaurant } = await kitchenContext(req);
  const { id } = await ctx.params;
  await ownItem(restaurant.id, id);
  const form = await req.formData().catch(() => null);
  const photo = form?.get("photo");
  if (!(photo instanceof File) || photo.size === 0) throw badRequest("photo_required", "Choose a photo.");
  const url = await uploadImage("menu-photos", `${restaurant.id}/${id}-${Date.now()}.jpg`, photo).catch((e: Error) => {
    throw badRequest("upload_failed", e.message);
  });
  const { data, error } = await getServiceSupabase().from("menu_items").update({ image_url: url }).eq("id", id).select("*").single();
  if (error) throw dbError(error);
  return json({ item: data });
});
