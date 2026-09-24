import { z } from "zod";
import { json, readJson, route } from "@/lib/server/http";
import { kitchenContext, kitchenOrder } from "@/lib/server/kitchen-request";
import { transitionOrThrow } from "@/lib/server/rpc";

const body = z.object({ reason: z.string().trim().min(2).max(200) });

export const POST = route(async (req: Request, ctx: RouteContext<"/api/restaurant/orders/[id]/reject">) => {
  const { restaurant, actor } = await kitchenContext(req);
  const { id } = await ctx.params;
  const { reason } = body.parse(await readJson(req));
  await kitchenOrder(restaurant.id, id);
  await transitionOrThrow(id, "rejected", actor, { reason });
  return json({ ok: true });
});
