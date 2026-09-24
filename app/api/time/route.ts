import { getServiceSupabase } from "@/lib/supabase/service";
import { json, route, dbError } from "@/lib/server/http";

/** Server clock for countdowns (rule 4). Returns DB app time (includes dev time warp). */
export const GET = route(async () => {
  const { data, error } = await getServiceSupabase().rpc("server_clock");
  if (error) throw dbError(error);
  const clock = data as { app_now_ms: number; real_now_ms: number; warp_factor: number };
  return json({ now: Number(clock.app_now_ms), warp: Number(clock.warp_factor) });
});
