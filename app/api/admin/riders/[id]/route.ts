import { getServiceSupabase } from "@/lib/supabase/service";
import type { TablesUpdate } from "@/lib/supabase/database.types";
import { requireAdmin } from "@/lib/server/admin";
import { riderPatchSchema } from "@/lib/server/admin-manage";
import { badRequest, dbError, json, readJson, route } from "@/lib/server/http";

export const PATCH = route(async (req: Request, ctx: RouteContext<"/api/admin/riders/[id]">) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const { forceOffline, ...patch } = riderPatchSchema.parse(await readJson(req));
  const sb = getServiceSupabase();
  const update: TablesUpdate<"riders"> = { ...patch };
  if (forceOffline || patch.is_active === false) {
    const { data: r } = await sb.from("riders").select("status").eq("id", id).single();
    if (r?.status === "busy") throw badRequest("busy", "Reassign this rider's job first.");
    update.status = "offline";
  }
  const { data, error } = await sb.from("riders").update(update).eq("id", id).select("*").single();
  if (error) throw dbError(error);
  return json({ rider: data });
});
