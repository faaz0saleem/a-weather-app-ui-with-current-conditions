import "server-only";

import type { Polygon } from "@/lib/geo";
import {
  checkEligibility,
  settingsFromRow,
  type EligibilityResult,
  type GuaranteeSettings,
  type RiderSnapshot,
} from "@/lib/guarantee";
import { getServiceSupabase } from "@/lib/supabase/service";
import type { Tables } from "@/lib/supabase/database.types";
import { dbError } from "./http";

export type RestaurantRow = Tables<"restaurants">;

const ACTIVE = ["placed", "accepted", "ready", "picked_up", "arrived"] as const;

/** Everything the eligibility check needs, read in one go with DB time. */
export type DispatchContext = {
  /** DB app time (includes dev time warp). */
  now: Date;
  realNow: Date;
  settings: GuaranteeSettings;
  zones: Polygon[];
  riders: RiderSnapshot[];
  /** Orders placed/accepted but not ready, per restaurant. */
  kitchenQueue: Map<string, number>;
  /** Orders waiting for a rider (placed/accepted/ready without one). */
  reservedRiders: number;
};

export async function getClock(): Promise<{ now: Date; realNow: Date; warp: number }> {
  const { data, error } = await getServiceSupabase().rpc("server_clock");
  if (error) throw dbError(error);
  const c = data as { app_now_ms: number; real_now_ms: number; warp_factor: number };
  return { now: new Date(Number(c.app_now_ms)), realNow: new Date(Number(c.real_now_ms)), warp: Number(c.warp_factor) };
}

export async function getSettings(): Promise<GuaranteeSettings> {
  const { data, error } = await getServiceSupabase().from("app_settings").select("*").eq("id", true).single();
  if (error) throw dbError(error);
  return settingsFromRow(data);
}

export async function getActiveZones(): Promise<Polygon[]> {
  const { data } = await getServiceSupabase().from("zones").select("polygon").eq("is_active", true);
  return (data ?? []).map((z) => z.polygon as unknown as Polygon);
}

export async function loadDispatchContext(): Promise<DispatchContext> {
  const sb = getServiceSupabase();
  const [clock, settings, zones, ridersRes, ordersRes] = await Promise.all([
    getClock(),
    getSettings(),
    getActiveZones(),
    sb.from("riders").select("id, status, is_active, last_lat, last_lng, last_seen_at, current_order_id").eq("is_active", true),
    sb.from("orders").select("id, restaurant_id, rider_id, status, drop_lat, drop_lng").in("status", [...ACTIVE]),
  ]);
  if (ridersRes.error) throw dbError(ridersRes.error);
  if (ordersRes.error) throw dbError(ordersRes.error);

  const orders = ordersRes.data;
  const byId = new Map(orders.map((o) => [o.id, o]));
  // GPS timestamps are real time; shift them into app time so freshness still works under time warp.
  const warpOffset = clock.now.getTime() - clock.realNow.getTime();

  const riders: RiderSnapshot[] = ridersRes.data.map((r) => {
    const job = r.current_order_id ? byId.get(r.current_order_id) : undefined;
    return {
      id: r.id,
      status: r.status,
      isActive: r.is_active,
      position: r.last_lat != null && r.last_lng != null ? { lat: r.last_lat, lng: r.last_lng } : null,
      lastSeenAt: r.last_seen_at ? new Date(new Date(r.last_seen_at).getTime() + warpOffset) : null,
      job: job ? { status: job.status, drop: { lat: job.drop_lat, lng: job.drop_lng } } : null,
    };
  });

  const kitchenQueue = new Map<string, number>();
  let reservedRiders = 0;
  for (const o of orders) {
    if (o.status === "placed" || o.status === "accepted")
      kitchenQueue.set(o.restaurant_id, (kitchenQueue.get(o.restaurant_id) ?? 0) + 1);
    if ((o.status === "placed" || o.status === "accepted" || o.status === "ready") && !o.rider_id) reservedRiders++;
  }

  return { now: clock.now, realNow: clock.realNow, settings, zones, riders, kitchenQueue, reservedRiders };
}

/** Typical fast-lane prep for a restaurant when there's no cart yet (browse ETAs). */
export function typicalPrepMin(prepMins: number[], s: GuaranteeSettings): number {
  const fast = prepMins.filter((p) => p <= s.fastLaneMaxPrepMin).sort((a, b) => a - b);
  if (!fast.length) return s.fastLaneMaxPrepMin;
  return fast[Math.floor(fast.length / 2)];
}

export function quote(
  ctx: DispatchContext,
  r: RestaurantRow,
  drop: { lat: number; lng: number },
  cartMaxPrepMin: number,
): EligibilityResult {
  return checkEligibility({
    now: ctx.now,
    settings: ctx.settings,
    zones: ctx.zones,
    restaurant: {
      id: r.id,
      lat: r.lat,
      lng: r.lng,
      radiusKm: r.radius_km == null ? null : Number(r.radius_km),
      opensAt: r.opens_at,
      closesAt: r.closes_at,
      isActive: r.is_active,
      isAccepting: r.is_accepting,
      pausedUntil: r.paused_until ? new Date(r.paused_until) : null,
    },
    drop,
    cartMaxPrepMin,
    ordersInKitchen: ctx.kitchenQueue.get(r.id) ?? 0,
    riders: ctx.riders,
    reservedRiders: ctx.reservedRiders,
  });
}
