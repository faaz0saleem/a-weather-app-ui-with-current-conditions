import { requireViewer } from "@/lib/server/auth";
import { getCustomerOrder } from "@/lib/server/customer-orders";
import { json, notFound, route } from "@/lib/server/http";

/** Race screen data. Evaluates the clock on every read (free flips server-side, rule 3). */
export const GET = route(async (_req: Request, ctx: RouteContext<"/api/orders/[id]">) => {
  const viewer = await requireViewer();
  const { id } = await ctx.params;
  const order = await getCustomerOrder(viewer, id);
  if (!order) throw notFound("Order not found");
  return json({ order });
});
