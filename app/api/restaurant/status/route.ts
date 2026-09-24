import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/service";
import { getClock } from "@/lib/server/dispatch";
import { dbError, json, readJson, route } from "@/lib/server/http";
import { kitchenContext } from "@/lib/server/kitchen-request";

const body = z.object({
  /** Pause for N minutes ("Busy, back in X min"); 0 = resume now. */
  pauseMin: z.number().int().min(0).max(240).optional(),
  pauseReason: z.string().max(120).optional(),
  isAccepting: z.boolean().optional(),
});

export const POST = route(async (req: Request) => {
  const { restaurant } = await kitchenContext(req);
  const input = body.parse(await readJson(req));
  const patch: { paused_until?: string | null; pause_reason?: string | null; is_accepting?: boolean } = {};
  if (input.pauseMin !== undefined) {
    const { now } = await getClock();
    patch.paused_until = input.pauseMin > 0 ? new Date(now.getTime() + input.pauseMin * 60_000).toISOString() : null;
    patch.pause_reason = input.pauseMin > 0 ? (input.pauseReason ?? "Busy") : null;
  }
  if (input.isAccepting !== undefined) patch.is_accepting = input.isAccepting;
  const { data, error } = await getServiceSupabase().from("restaurants").update(patch).eq("id", restaurant.id).select("paused_until, is_accepting").single();
  if (error) throw dbError(error);
  return json({ pausedUntil: data.paused_until, isAccepting: data.is_accepting });
});
