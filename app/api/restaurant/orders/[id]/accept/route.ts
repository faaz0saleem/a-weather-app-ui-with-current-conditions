import { z } from "zod";
import { getSettings } from "@/lib/server/dispatch";
import { evaluateOrder } from "@/lib/server/engine";
import { badRequest, json, readJson, route } from "@/lib/server/http";
import { maxCommitMin } from "@/lib/server/kitchen";
import { kitchenContext, kitchenOrder } from "@/lib/server/kitchen-request";
import { transitionOrThrow } from "@/lib/server/rpc";

const body = z.object({ prepMin: z.number().int().min(1).max(90) });

/** Accept + commit a prep time (rule 10). Auto-assigns the nearest free rider right after. */
export const POST = route(async (req: Request, ctx: RouteContext<"/api/restaurant/orders/[id]/accept">) => {
  const { restaurant, actor } = await kitchenContext(req);
  const { id } = await ctx.params;
  const { prepMin } = body.parse(await readJson(req));
  const order = await kitchenOrder(restaurant.id, id);
  const s = await getSettings();
  const cap = maxCommitMin(order.predicted_prep_min, s.fastLaneMaxPrepMin);
  if (prepMin > cap) throw badRequest("prep_too_long", `Commit at most ${cap} min for this order.`);
  await transitionOrThrow(id, "accepted", actor, { committed_prep_min: prepMin });
  await evaluateOrder(id);
  return json({ ok: true });
});
