import { evaluateOrder } from "@/lib/server/engine";
import { json, route } from "@/lib/server/http";
import { getRiderState, requireRider, riderOwnsOrder } from "@/lib/server/rider";
import { transitionOrThrow } from "@/lib/server/rpc";

/** Handed over + cash collected (the amount the server says, never a device-side number). */
export const POST = route(async (_req: Request, ctx: RouteContext<"/api/rider/jobs/[id]/delivered">) => {
  const { viewer, actor } = await requireRider();
  const { id } = await ctx.params;
  await riderOwnsOrder(viewer.id, id);
  await evaluateOrder(id); // make sure the free/on-time outcome is recorded first
  await transitionOrThrow(id, "delivered", actor);
  await evaluateOrder(id);
  return json(await getRiderState(viewer.id));
});
