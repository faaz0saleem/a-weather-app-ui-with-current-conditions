import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/server/admin";
import { getClock } from "@/lib/server/dispatch";
import { dbError, json, readJson, route } from "@/lib/server/http";
import { requireSimAllowed, simCleanup, simRidersOnline, spawnSimOrders } from "@/lib/server/sim";

const body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("start") }),
  z.object({ action: z.literal("stop") }),
  z.object({ action: z.literal("riders_online") }),
  z.object({ action: z.literal("cleanup") }),
  z.object({ action: z.literal("warp"), factor: z.number().min(1).max(60) }),
  z.object({
    action: z.literal("spawn"),
    count: z.number().int().min(1).max(20),
    restaurantId: z.string().uuid().nullable().optional(),
    slowKitchenMin: z.number().int().min(0).max(60).optional(),
    slowRiderFactor: z.number().min(1).max(5).optional(),
  }),
]);

/** Dev-only simulation controls (NEXT_PUBLIC_DEV_TOOLS + settings.dev_tools_enabled). */
export const POST = route(async (req: Request) => {
  await requireAdmin();
  await requireSimAllowed();
  const input = body.parse(await readJson(req));
  const sb = getServiceSupabase();
  switch (input.action) {
    case "start":
      await sb.from("app_settings").update({ sim_running: true }).eq("id", true);
      return json({ ok: true, riders: await simRidersOnline() });
    case "stop":
      await sb.from("app_settings").update({ sim_running: false }).eq("id", true);
      return json({ ok: true });
    case "riders_online":
      return json({ ok: true, riders: await simRidersOnline() });
    case "cleanup":
      return json({ ok: true, ...(await simCleanup()) });
    case "warp": {
      const { error } = await sb.rpc("set_time_warp", { p_factor: input.factor });
      if (error) throw dbError(error);
      return json({ ok: true, clock: await getClock() });
    }
    case "spawn": {
      await simRidersOnline();
      const results = await spawnSimOrders({
        count: input.count,
        restaurantId: input.restaurantId ?? null,
        knobs: { slow_kitchen_min: input.slowKitchenMin, slow_rider_factor: input.slowRiderFactor },
      });
      return json({ ok: true, results });
    }
  }
});

export const GET = route(async () => {
  await requireAdmin();
  const [{ data: s }, clock, { count }] = await Promise.all([
    getServiceSupabase().from("app_settings").select("sim_running, dev_tools_enabled, warp_factor").eq("id", true).single(),
    getClock(),
    getServiceSupabase().from("orders").select("id", { count: "exact", head: true }).eq("is_simulated", true).in("status", ["placed", "accepted", "ready", "picked_up", "arrived"]),
  ]);
  return json({ simRunning: s?.sim_running ?? false, devToolsEnabled: s?.dev_tools_enabled ?? false, warp: clock.warp, activeSimOrders: count ?? 0, now: clock.now });
});
