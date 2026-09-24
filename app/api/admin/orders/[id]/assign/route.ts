import { z } from "zod";
import { riderPayoutPkr } from "@/lib/guarantee";
import { getServiceSupabase } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/server/admin";
import { getSettings } from "@/lib/server/dispatch";
import { dbError, json, notFound, readJson, route } from "@/lib/server/http";
import { assignRider } from "@/lib/server/rpc";

const body = z.object({ riderId: z.string().uuid().nullable() });

/** Manual (re)assignment. Pay is recomputed from distance — never from lateness. */
export const POST = route(async (req: Request, ctx: RouteContext<"/api/admin/orders/[id]/assign">) => {
  const { actor } = await requireAdmin();
  const { id } = await ctx.params;
  const { riderId } = body.parse(await readJson(req));
  const { data: o } = await getServiceSupabase().from("orders").select("distance_km").eq("id", id).maybeSingle();
  if (!o) throw notFound("Order not found");
  const s = await getSettings();
  const { error } = await assignRider(id, riderId, actor, riderPayoutPkr(Number(o.distance_km), s));
  if (error) throw dbError(error);
  return json({ ok: true });
});
