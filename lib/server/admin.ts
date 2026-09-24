import "server-only";

import { isPredictedLate, predictArrival } from "@/lib/guarantee";
import { getServiceSupabase } from "@/lib/supabase/service";
import { requireViewer } from "./auth";
import { forbidden } from "./http";
import { getClock, getSettings } from "./dispatch";
import type { Actor } from "./rpc";

export async function requireAdmin() {
  const viewer = await requireViewer(["admin"]);
  if (viewer.role !== "admin") throw forbidden();
  const actor: Actor = { id: viewer.id, role: "admin" };
  return { viewer, actor };
}

const ACTIVE = ["placed", "accepted", "ready", "picked_up", "arrived"] as const;

export type LiveOrder = {
  id: string;
  code: string;
  status: string;
  guaranteeActive: boolean;
  guaranteeState: string;
  placedAt: string;
  acceptBy: string;
  promisedBy: string | null;
  readyBy: string | null;
  predictedArrival: string | null;
  lateRisk: boolean;
  restaurant: { id: string; name: string; emoji: string; lat: number; lng: number };
  drop: { lat: number; lng: number; address: string };
  customerName: string;
  rider: { id: string; name: string } | null;
  totalPkr: number;
  isSimulated: boolean;
  arrivalFlagged: boolean;
};

export type LiveRider = {
  id: string;
  name: string;
  status: "offline" | "idle" | "busy";
  lat: number | null;
  lng: number | null;
  lastSeenAt: string | null;
  isTest: boolean;
  isActive: boolean;
  currentOrderId: string | null;
};

export async function getLiveBoard() {
  const sb = getServiceSupabase();
  const [clock, s, ordersRes, ridersRes, flaggedRes] = await Promise.all([
    getClock(),
    getSettings(),
    sb
      .from("orders")
      .select("id, code, status, guarantee_active, guarantee_state, placed_at, accept_by, promised_by, ready_by, predicted_prep_min, drop_lat, drop_lng, drop_address, customer_name, rider_id, total_pkr, is_simulated, arrival_flagged, restaurants(id, name, hero_emoji, lat, lng)")
      .in("status", [...ACTIVE])
      .order("placed_at"),
    sb.from("riders").select("id, status, last_lat, last_lng, last_seen_at, is_test, is_active, current_order_id, profiles(full_name)"),
    sb.from("orders").select("id", { count: "exact", head: true }).eq("arrival_flagged", true).is("arrival_reviewed_at", null),
  ]);

  const riders: LiveRider[] = (ridersRes.data ?? []).map((r) => ({
    id: r.id,
    name: r.profiles?.full_name ?? "",
    status: r.status,
    lat: r.last_lat,
    lng: r.last_lng,
    lastSeenAt: r.last_seen_at,
    isTest: r.is_test,
    isActive: r.is_active,
    currentOrderId: r.current_order_id,
  }));
  const riderById = new Map(riders.map((r) => [r.id, r]));

  const orders: LiveOrder[] = (ordersRes.data ?? []).map((o) => {
    const rest = o.restaurants!;
    const rider = o.rider_id ? riderById.get(o.rider_id) : undefined;
    const predicted = predictArrival(
      {
        status: o.status,
        restaurant: { lat: rest.lat, lng: rest.lng },
        drop: { lat: o.drop_lat, lng: o.drop_lng },
        readyBy: o.ready_by ? new Date(o.ready_by) : null,
        predictedPrepMin: o.predicted_prep_min,
        rider: rider?.lat != null && rider?.lng != null ? { lat: rider.lat, lng: rider.lng } : null,
      },
      clock.now,
      s,
    );
    const promised = o.promised_by ? new Date(o.promised_by) : null;
    return {
      id: o.id,
      code: o.code,
      status: o.status,
      guaranteeActive: o.guarantee_active,
      guaranteeState: o.guarantee_state,
      placedAt: o.placed_at,
      acceptBy: o.accept_by,
      promisedBy: o.promised_by,
      readyBy: o.ready_by,
      predictedArrival: predicted?.toISOString() ?? null,
      lateRisk: o.guarantee_state === "active" && isPredictedLate(predicted, promised),
      restaurant: { id: rest.id, name: rest.name, emoji: rest.hero_emoji, lat: rest.lat, lng: rest.lng },
      drop: { lat: o.drop_lat, lng: o.drop_lng, address: o.drop_address },
      customerName: o.customer_name,
      rider: rider ? { id: rider.id, name: rider.name } : null,
      totalPkr: o.total_pkr,
      isSimulated: o.is_simulated,
      arrivalFlagged: o.arrival_flagged,
    };
  });

  return {
    now: clock.now.toISOString(),
    warp: clock.warp,
    rainMode: s.rainMode,
    orders,
    riders,
    flaggedCount: flaggedRes.count ?? 0,
  };
}

export type LiveBoard = Awaited<ReturnType<typeof getLiveBoard>>;

export type AnalyticsReport = {
  orders: number;
  delivered: number;
  arrived: number;
  rejected: number;
  cancelled: number;
  timeouts: number;
  gmv_pkr: number;
  avg_delivery_min: number | null;
  on_time_pct: number | null;
  free_orders: number;
  free_cost_pkr: number;
  kitchen_charges_pkr: number;
  flagged_arrivals: number;
  lates_by_cause: Record<string, number>;
  by_restaurant: {
    id: string;
    name: string;
    orders: number;
    on_time: number;
    late: number;
    kitchen_lates: number;
    avg_min: number | null;
    free_cost_pkr: number;
    charged_pkr: number;
  }[];
  by_hour: { hour: number; orders: number; late: number; avg_min: number | null }[];
};

export async function getAnalytics(range: "today" | "7d" | "30d", includeSim: boolean): Promise<AnalyticsReport> {
  const sb = getServiceSupabase();
  const { now } = await getClock();
  let from: Date;
  if (range === "today") {
    const { data } = await sb.rpc("karachi_day_start");
    from = new Date(data as string);
  } else {
    from = new Date(now.getTime() - (range === "7d" ? 7 : 30) * 86_400_000);
  }
  const to = new Date(now.getTime() + 60_000);
  const { data } = await sb.rpc("analytics_report", { p_from: from.toISOString(), p_to: to.toISOString(), p_include_sim: includeSim });
  return data as unknown as AnalyticsReport;
}
