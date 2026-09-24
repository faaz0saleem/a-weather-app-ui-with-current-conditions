import { getServiceSupabase } from "@/lib/supabase/service";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { requireAdmin } from "@/lib/server/admin";
import { restaurantSchema, staffSchema } from "@/lib/server/admin-manage";
import { getClock } from "@/lib/server/dispatch";
import { dbError, json, readJson, route } from "@/lib/server/http";
import { createStaffAccount } from "@/lib/server/phone-auth";

export const PATCH = route(async (req: Request, ctx: RouteContext<"/api/admin/restaurants/[id]">) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const raw = (await readJson(req)) as Record<string, unknown>;
  const patch: TablesUpdate<"restaurants"> = restaurantSchema.partial().parse(raw);
  if (typeof raw.pauseMin === "number") {
    const { now } = await getClock();
    patch.paused_until = raw.pauseMin > 0 ? new Date(now.getTime() + raw.pauseMin * 60_000).toISOString() : null;
    patch.pause_reason = raw.pauseMin > 0 ? "Paused by ops" : null;
  }
  const { data, error } = await getServiceSupabase().from("restaurants").update(patch).eq("id", id).select("*").single();
  if (error) throw dbError(error);
  return json({ restaurant: data });
});

/** Add a kitchen login for this restaurant. */
export const POST = route(async (req: Request, ctx: RouteContext<"/api/admin/restaurants/[id]">) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const staff = staffSchema.parse(await readJson(req));
  const acct = await createStaffAccount(staff);
  const { error } = await getServiceSupabase()
    .from("profiles")
    .update({ role: "restaurant", restaurant_id: id, full_name: staff.fullName, phone: acct.phone })
    .eq("id", acct.id);
  if (error) throw dbError(error);
  return json({ ok: true });
});
