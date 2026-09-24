import { getServiceSupabase } from "@/lib/supabase/service";
import { requireViewer } from "@/lib/server/auth";
import { json, notFound, route } from "@/lib/server/http";
import { transitionOrThrow } from "@/lib/server/rpc";

/** Customer cancel — only before the kitchen accepts (D17). The DB enforces it. */
export const POST = route(async (_req: Request, ctx: RouteContext<"/api/orders/[id]/cancel">) => {
  const viewer = await requireViewer(["customer"]);
  const { id } = await ctx.params;
  const { data: o } = await getServiceSupabase().from("orders").select("customer_id").eq("id", id).maybeSingle();
  if (!o || (o.customer_id !== viewer.id && viewer.role !== "admin")) throw notFound("Order not found");
  const actor = viewer.role === "admin" ? { id: viewer.id, role: "admin" as const } : { id: viewer.id, role: "customer" as const };
  await transitionOrThrow(id, "cancelled", actor, { reason: "customer_cancelled" });
  return json({ ok: true });
});
