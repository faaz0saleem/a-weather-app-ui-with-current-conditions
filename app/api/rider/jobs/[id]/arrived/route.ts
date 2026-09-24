import { z } from "zod";
import { checkArrival } from "@/lib/guarantee";
import { getSettings } from "@/lib/server/dispatch";
import { evaluateOrder } from "@/lib/server/engine";
import { ApiError, json, readJson, route } from "@/lib/server/http";
import { getRiderState, requireRider, riderOwnsOrder, saveRiderLocation } from "@/lib/server/rider";
import { transitionOrThrow } from "@/lib/server/rpc";

const body = z.object({
  lat: z.number().min(-90).max(90).nullable().optional(),
  lng: z.number().min(-180).max(180).nullable().optional(),
  accuracy: z.number().min(0).nullable().optional(),
  reason: z.string().trim().max(200).nullable().optional(),
});

/**
 * Rule 2: the clock stops here — only within the geofence of the drop pin, or
 * with a reason (flagged for admin review). The DB stamps arrived_at with its
 * own clock; the guarantee outcome is decided right after.
 */
export const POST = route(async (req: Request, ctx: RouteContext<"/api/rider/jobs/[id]/arrived">) => {
  const { viewer, actor } = await requireRider();
  const { id } = await ctx.params;
  const input = body.parse(await readJson(req));
  const order = await riderOwnsOrder(viewer.id, id);
  const s = await getSettings();
  const position = input.lat != null && input.lng != null ? { lat: input.lat, lng: input.lng } : null;
  const check = checkArrival({ position, drop: { lat: order.drop_lat, lng: order.drop_lng }, reason: input.reason }, s);

  if (!check.ok) {
    throw new ApiError(409, check.code, check.code === "no_gps" ? "We couldn't get your GPS." : "You're not at the drop pin yet.", {
      distanceM: check.distanceM,
      geofenceM: check.geofenceM,
    });
  }
  if (position) await saveRiderLocation(viewer.id, { ...position, accuracy: input.accuracy });

  await transitionOrThrow(id, "arrived", actor, {
    within_geofence: check.withinGeofence,
    reason: check.withinGeofence ? null : check.reason,
    distance_m: check.distanceM,
    lat: position?.lat ?? null,
    lng: position?.lng ?? null,
    accuracy_m: input.accuracy ?? null,
  });
  await evaluateOrder(id); // decide on_time / free + attribution immediately
  return json(await getRiderState(viewer.id));
});
