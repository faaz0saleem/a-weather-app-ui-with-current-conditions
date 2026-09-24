import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/server/admin";
import { dbError, json, readJson, route } from "@/lib/server/http";

const body = z.object({ note: z.string().trim().max(300).default("") });

/** Close a flagged arrival (GPS problem) after review. */
export const POST = route(async (req: Request, ctx: RouteContext<"/api/admin/orders/[id]/review">) => {
  const { viewer } = await requireAdmin();
  const { id } = await ctx.params;
  const { note } = body.parse(await readJson(req));
  const sb = getServiceSupabase();
  const { error } = await sb.from("orders").update({ arrival_reviewed_at: new Date().toISOString(), arrival_review_note: note || "OK" }).eq("id", id);
  if (error) throw dbError(error);
  await sb.from("order_events").insert({ order_id: id, kind: "review", actor_id: viewer.id, actor_role: "admin", meta: { note } });
  return json({ ok: true });
});
