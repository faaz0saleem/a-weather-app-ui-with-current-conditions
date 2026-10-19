import "server-only";

import { stepTowards, haversineM } from "@/lib/geo";
import { parseOptionGroups } from "@/lib/guarantee/pricing";
import { DEV_TOOLS } from "@/lib/supabase/env";
import { getServiceSupabase } from "@/lib/supabase/service";
import type { Json } from "@/lib/supabase/database.types";
import { RIDERS } from "@/supabase/seed/data";
import type { Viewer } from "./auth";
import { getClock, getSettings } from "./dispatch";
import { evaluateOrder } from "./engine";
import { ApiError } from "./http";
import { placeOrder } from "./orders";
import { transition, type Actor } from "./rpc";

/**
 * Dev-only simulation: spawn test orders, a pretend kitchen that accepts and
 * cooks, and simulated riders that drive the route at the ETA model's speed —
 * all on app time, so the 10× time warp speeds everything up together.
 * Runs inside the background tick while app_settings.sim_running is true.
 */
export type SimKnobs = { slow_kitchen_min?: number; slow_rider_factor?: number };

const AUTO_ACCEPT_AFTER_SEC = 20;
const HANDOVER_AFTER_SEC = 60;
const AT_STOP_M = 20;

let lastTickApp: number | null = null;

export async function requireSimAllowed() {
  if (!DEV_TOOLS) throw new ApiError(404, "not_found", "Not found");
  const s = await getSettings();
  if (!s.devToolsEnabled) throw new ApiError(409, "dev_tools_disabled", "Turn on Dev tools in Admin → Settings first.");
  return s;
}

async function adminActor(): Promise<Actor | null> {
  const { data } = await getServiceSupabase().from("profiles").select("id").eq("role", "admin").limit(1).maybeSingle();
  return data ? { id: data.id, role: "admin" } : null;
}

/** Put every idle/offline test rider online at their seeded spot (or where they are). */
export async function simRidersOnline() {
  const sb = getServiceSupabase();
  const { data: riders } = await sb.from("riders").select("id, status, last_lat, last_lng, profiles(phone)").eq("is_test", true);
  for (const r of riders ?? []) {
    const seed = RIDERS.find((x) => x.phone === r.profiles?.phone);
    await sb
      .from("riders")
      .update({
        status: r.status === "busy" ? "busy" : "idle",
        last_lat: r.last_lat ?? seed?.start[0] ?? null,
        last_lng: r.last_lng ?? seed?.start[1] ?? null,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", r.id);
  }
  return riders?.length ?? 0;
}

export async function simTickIfRunning() {
  if (!DEV_TOOLS) return;
  const s = await getSettings();
  if (!s.simRunning || !s.devToolsEnabled) {
    lastTickApp = null;
    return;
  }
  const sb = getServiceSupabase();
  const { now, realNow } = await getClock();
  const nowMs = now.getTime();
  const dtMin = lastTickApp ? Math.min(10, Math.max(0, (nowMs - lastTickApp) / 60000)) : 0;
  lastTickApp = nowMs;

  // Test riders stay "online" while the sim runs.
  await sb.from("riders").update({ last_seen_at: realNow.toISOString() }).eq("is_test", true).neq("status", "offline");

  const admin = await adminActor();
  if (!admin) return;

  const { data: orders } = await sb
    .from("orders")
    .select("id, status, placed_at, ready_by, arrived_at, predicted_prep_min, drop_lat, drop_lng, rider_id, sim, restaurants(lat, lng)")
    .eq("is_simulated", true)
    .in("status", ["placed", "accepted", "ready", "picked_up", "arrived"]);

  for (const o of orders ?? []) {
    const knobs = (o.sim ?? {}) as SimKnobs;
    try {
      if (o.status === "placed" && nowMs - new Date(o.placed_at).getTime() >= AUTO_ACCEPT_AFTER_SEC * 1000) {
        await transition(o.id, "accepted", admin, { committed_prep_min: Math.max(1, o.predicted_prep_min) }, { simulated: true });
        await evaluateOrder(o.id);
        continue;
      }
      if (o.status === "accepted" && o.ready_by && nowMs >= new Date(o.ready_by).getTime() + (knobs.slow_kitchen_min ?? 0) * 60_000) {
        await transition(o.id, "ready", admin, {}, { simulated: true, photo_skipped: true });
      }
      if (o.status === "arrived" && o.arrived_at && nowMs - new Date(o.arrived_at).getTime() >= HANDOVER_AFTER_SEC * 1000 && o.rider_id) {
        await transition(o.id, "delivered", { id: o.rider_id, role: "rider" }, {}, { simulated: true });
        await evaluateOrder(o.id);
        continue;
      }

      // Drive the rider.
      if (!o.rider_id || !o.restaurants || dtMin === 0) continue;
      const { data: r } = await sb.from("riders").select("last_lat, last_lng").eq("id", o.rider_id).single();
      if (!r || r.last_lat == null || r.last_lng == null) continue;
      const pos = { lat: r.last_lat, lng: r.last_lng };
      const restaurant = { lat: o.restaurants.lat, lng: o.restaurants.lng };
      const drop = { lat: o.drop_lat, lng: o.drop_lng };
      const target = o.status === "picked_up" ? drop : o.status === "accepted" || o.status === "ready" ? restaurant : null;
      if (!target) continue;

      // Straight-line speed that makes the ride take exactly what the ETA model predicts.
      const kmPerMin = s.riderSpeedKmh / s.routeFactor / 60 / Math.max(0.2, knobs.slow_rider_factor ?? 1);
      const step = stepTowards(pos, target, kmPerMin * dtMin);
      await sb
        .from("riders")
        .update({ last_lat: step.point.lat, last_lng: step.point.lng, last_accuracy_m: 8, last_seen_at: realNow.toISOString() })
        .eq("id", o.rider_id);

      const rider: Actor = { id: o.rider_id, role: "rider" };
      if (o.status === "ready" && haversineM(step.point, restaurant) <= AT_STOP_M) {
        await transition(o.id, "picked_up", rider, {}, { simulated: true });
      } else if (o.status === "picked_up" && haversineM(step.point, drop) <= AT_STOP_M) {
        await transition(
          o.id,
          "arrived",
          rider,
          { within_geofence: true, distance_m: Math.round(haversineM(step.point, drop)), lat: step.point.lat, lng: step.point.lng, accuracy_m: 8 },
          { simulated: true },
        );
        await evaluateOrder(o.id);
      }
    } catch (e) {
      console.warn("[sim]", o.id, e instanceof Error ? e.message : e);
    }
  }
}

/** Spawn `count` test orders from test customers to random open, eligible kitchens. */
export async function spawnSimOrders(opts: { count: number; restaurantId?: string | null; knobs?: SimKnobs }) {
  const sb = getServiceSupabase();
  const [{ data: customers }, { data: restaurants }, s] = await Promise.all([
    sb.from("profiles").select("id, full_name, phone, addresses(id, is_default)").eq("role", "customer").eq("is_test", true),
    sb.from("restaurants").select("id, name").eq("is_active", true),
    getSettings(),
  ]);
  const results: { ok: boolean; code?: string; restaurant?: string; message?: string }[] = [];
  const pool = (restaurants ?? []).filter((r) => !opts.restaurantId || r.id === opts.restaurantId);

  for (let i = 0; i < opts.count; i++) {
    const c = customers?.[Math.floor(Math.random() * (customers?.length ?? 1))];
    const address = c?.addresses?.find((a) => a.is_default) ?? c?.addresses?.[0];
    if (!c || !address) {
      results.push({ ok: false, message: "No test customer with an address — run npm run seed." });
      continue;
    }
    const viewer: Viewer = { id: c.id, role: "customer", fullName: c.full_name, phone: c.phone, restaurantId: null, avatarUrl: null };
    // Try kitchens in random order until one can take the order.
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    let placed = false;
    let lastErr: { code?: string; message?: string } = {};
    for (const r of shuffled.slice(0, 6)) {
      const { data: items } = await sb.from("menu_items").select("*").eq("restaurant_id", r.id).eq("is_active", true).eq("is_available", true).lte("prep_min", s.fastLaneMaxPrepMin);
      if (!items?.length) continue;
      const lines = [...items]
        .sort(() => Math.random() - 0.5)
        .slice(0, 1 + Math.floor(Math.random() * 3))
        .map((it) => ({
          itemId: it.id,
          qty: 1 + Math.floor(Math.random() * 2),
          options: Object.fromEntries(parseOptionGroups(it.option_groups).filter((g) => g.min > 0).map((g) => [g.id, [g.options[0].id]])),
        }));
      try {
        const order = await placeOrder(viewer, { restaurantId: r.id, addressId: address.id, lines, expectGuarantee: false }, { simulated: true });
        if (opts.knobs && (opts.knobs.slow_kitchen_min || opts.knobs.slow_rider_factor)) {
          await sb.from("orders").update({ sim: opts.knobs as unknown as Json }).eq("id", order.id);
        }
        results.push({ ok: true, restaurant: r.name });
        placed = true;
        break;
      } catch (e) {
        lastErr = e instanceof ApiError ? { code: e.code, message: e.message } : { message: (e as Error).message };
      }
    }
    if (!placed) results.push({ ok: false, ...lastErr });
  }
  return results;
}

export async function simCleanup() {
  const sb = getServiceSupabase();
  await sb.rpc("set_time_warp", { p_factor: 1 });
  const { data: deleted } = await sb.rpc("dev_delete_orders", { p_only_simulated: true });
  await sb.from("app_settings").update({ sim_running: false }).eq("id", true);
  lastTickApp = null;
  // Riders back to their seeded spots, idle.
  const { data: riders } = await sb.from("riders").select("id, status, profiles(phone)").eq("is_test", true);
  for (const r of riders ?? []) {
    const seed = RIDERS.find((x) => x.phone === r.profiles?.phone);
    if (r.status === "busy") continue;
    await sb.from("riders").update({ last_lat: seed?.start[0] ?? null, last_lng: seed?.start[1] ?? null }).eq("id", r.id);
  }
  return { deleted: Number(deleted ?? 0) };
}
