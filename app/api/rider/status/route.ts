import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/service";
import { sweep } from "@/lib/server/engine";
import { badRequest, json, readJson, route } from "@/lib/server/http";
import { getRiderState, requireRider, saveRiderLocation } from "@/lib/server/rider";

const body = z.object({
  online: z.boolean(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).optional(),
});

export const POST = route(async (req: Request) => {
  const { viewer } = await requireRider();
  const input = body.parse(await readJson(req));
  const sb = getServiceSupabase();
  const { data: r } = await sb.from("riders").select("status").eq("id", viewer.id).single();
  if (!input.online && r?.status === "busy") throw badRequest("busy", "Finish your current job before going offline.");
  if (input.lat != null && input.lng != null) await saveRiderLocation(viewer.id, { lat: input.lat, lng: input.lng, accuracy: input.accuracy });
  if (r?.status !== "busy") await sb.from("riders").update({ status: input.online ? "idle" : "offline" }).eq("id", viewer.id);
  // Coming online may unblock orders waiting for a rider.
  if (input.online) await sweep();
  return json(await getRiderState(viewer.id));
});
