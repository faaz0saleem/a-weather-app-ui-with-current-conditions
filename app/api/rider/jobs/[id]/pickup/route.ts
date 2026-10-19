import { z } from "zod";
import { json, readJson, route } from "@/lib/server/http";
import { getRiderState, requireRider, riderOwnsOrder, saveRiderLocation } from "@/lib/server/rider";
import { transitionOrThrow } from "@/lib/server/rpc";

const body = z.object({ lat: z.number().optional(), lng: z.number().optional() });

export const POST = route(async (req: Request, ctx: RouteContext<"/api/rider/jobs/[id]/pickup">) => {
  const { viewer, actor } = await requireRider();
  const { id } = await ctx.params;
  const p = body.parse(await readJson(req).catch(() => ({})));
  await riderOwnsOrder(viewer.id, id);
  if (p.lat != null && p.lng != null) await saveRiderLocation(viewer.id, { lat: p.lat, lng: p.lng });
  await transitionOrThrow(id, "picked_up", actor);
  return json(await getRiderState(viewer.id));
});
