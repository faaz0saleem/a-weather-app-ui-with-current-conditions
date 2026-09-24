import { getServiceSupabase } from "@/lib/supabase/service";
import { evaluateOrder } from "@/lib/server/engine";
import { badRequest, json, route } from "@/lib/server/http";
import { uploadImage } from "@/lib/server/kitchen";
import { kitchenContext, kitchenOrder } from "@/lib/server/kitchen-request";
import { transitionOrThrow } from "@/lib/server/rpc";

/** Mark ready with a sealed-bag photo (multipart "photo"), or "noPhoto=1" when the camera fails (D12). */
export const POST = route(async (req: Request, ctx: RouteContext<"/api/restaurant/orders/[id]/ready">) => {
  const { restaurant, actor, viewer } = await kitchenContext(req);
  const { id } = await ctx.params;
  const order = await kitchenOrder(restaurant.id, id);
  const form = await req.formData().catch(() => null);
  const photo = form?.get("photo");
  let url: string | null = null;

  if (photo instanceof File && photo.size > 0) {
    try {
      url = await uploadImage("bag-photos", `${restaurant.id}/${order.code}-${Date.now()}.jpg`, photo);
    } catch (e) {
      throw badRequest("upload_failed", (e as Error).message);
    }
  } else if (form?.get("noPhoto") !== "1") {
    throw badRequest("photo_required", "Add a photo of the sealed bag (or tap 'camera not working').");
  }

  await transitionOrThrow(id, "ready", actor, url ? { sealed_bag_photo_url: url } : {}, url ? {} : { photo_skipped: true });
  if (!url) {
    await getServiceSupabase()
      .from("order_events")
      .insert({ order_id: id, kind: "photo", actor_id: viewer.id, actor_role: actor.role, meta: { skipped: true, reason: "camera_not_working" } });
  }
  await evaluateOrder(id);
  return json({ ok: true, photoUrl: url });
});
