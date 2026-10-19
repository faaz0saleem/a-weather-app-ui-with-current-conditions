import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/server/admin";
import { dbError, json, readJson, route } from "@/lib/server/http";

const int = (min: number, max: number) => z.number().int().min(min).max(max);
const num = (min: number, max: number) => z.number().min(min).max(max);

/** Every guarantee number (rule 12). The DB CHECK constraints are the final guard. */
const body = z
  .object({
    guarantee_window_min: int(10, 120),
    max_eta_min: int(5, 120),
    free_cap_pkr: int(0, 100000),
    accept_timeout_sec: int(30, 900),
    geofence_m: int(10, 1000),
    fast_lane_max_prep_min: int(1, 60),
    kitchen_charge_pct: int(0, 100),
    accept_buffer_min: int(0, 30),
    handoff_min: int(0, 30),
    rider_speed_kmh: num(5, 80),
    route_factor: num(1, 3),
    queue_penalty_min: int(0, 30),
    rider_soon_free_min: int(0, 30),
    rider_stale_sec: int(15, 3600),
    restaurant_radius_km: num(0.5, 30),
    delivery_fee_pkr: int(0, 5000),
    rain_mode: z.boolean(),
    rain_extra_min: int(0, 120),
    rider_base_pay_pkr: int(0, 10000),
    rider_per_km_pkr: int(0, 1000),
    location_broadcast_sec: int(2, 60),
    location_save_sec: int(5, 600),
    on_time_score_min_deliveries: int(0, 100000),
    dev_tools_enabled: z.boolean(),
  })
  .partial()
  .refine((v) => v.max_eta_min === undefined || v.guarantee_window_min === undefined || v.max_eta_min <= v.guarantee_window_min, {
    message: "Max ETA must be ≤ the guarantee window.",
  });

export const GET = route(async () => {
  await requireAdmin();
  const { data } = await getServiceSupabase().from("app_settings").select("*").eq("id", true).single();
  return json({ settings: data });
});

export const PATCH = route(async (req: Request) => {
  const { viewer } = await requireAdmin();
  const patch = body.parse(await readJson(req));
  const { data, error } = await getServiceSupabase()
    .from("app_settings")
    .update({ ...patch, updated_by: viewer.id })
    .eq("id", true)
    .select("*")
    .single();
  if (error) throw dbError(error);
  return json({ settings: data });
});
