import "server-only";

import { getServiceSupabase } from "@/lib/supabase/service";
import type { Viewer } from "./auth";
import { requireViewer } from "./auth";
import { forbidden, notFound } from "./http";
import { toRiderJob, type RiderJob } from "./rider-job";
import type { Actor } from "./rpc";

export type RiderToday = { jobs: number; earningsPkr: number; cashCollectedPkr: number; km: number };

export type RiderState = {
  rider: { id: string; name: string; status: "offline" | "idle" | "busy"; vehicle: string; plate: string | null };
  job: RiderJob | null;
  today: RiderToday;
  cadence: { broadcastSec: number; saveSec: number };
};

export async function requireRider(): Promise<{ viewer: Viewer; actor: Actor }> {
  const viewer = await requireViewer(["rider"]);
  if (viewer.role !== "rider") throw forbidden();
  return { viewer, actor: { id: viewer.id, role: "rider" } };
}

export async function loadRiderJob(orderId: string): Promise<RiderJob | null> {
  const sb = getServiceSupabase();
  const { data: o } = await sb
    .from("orders")
    .select(
      "id, code, status, drop_address, drop_lat, drop_lng, drop_gate_note, customer_name, customer_phone, customer_note, amount_to_collect_pkr, total_pkr, rider_payout_pkr, distance_km, restaurants(name, address, lat, lng, phone), order_items(name, qty)",
    )
    .eq("id", orderId)
    .maybeSingle();
  if (!o || !o.restaurants) return null;
  return toRiderJob(o as Parameters<typeof toRiderJob>[0], o.restaurants, o.order_items ?? []);
}

export async function getRiderState(riderId: string): Promise<RiderState> {
  const sb = getServiceSupabase();
  const [{ data: r }, { data: p }, { data: today }, { data: s }] = await Promise.all([
    sb.from("riders").select("status, vehicle, plate, current_order_id").eq("id", riderId).maybeSingle(),
    sb.from("profiles").select("full_name").eq("id", riderId).single(),
    sb.rpc("rider_today", { p_rider_id: riderId }),
    sb.from("app_settings").select("location_broadcast_sec, location_save_sec").eq("id", true).single(),
  ]);
  if (!r) throw notFound("Rider profile missing — ask ops to add you as a rider.");
  const job = r.current_order_id ? await loadRiderJob(r.current_order_id) : null;
  const d = (today ?? {}) as Record<string, number>;
  return {
    rider: { id: riderId, name: p?.full_name ?? "", status: r.status, vehicle: r.vehicle, plate: r.plate },
    job,
    today: {
      jobs: Number(d.jobs ?? 0),
      earningsPkr: Number(d.earnings_pkr ?? 0),
      cashCollectedPkr: Number(d.cash_collected_pkr ?? 0),
      km: Number(d.km ?? 0),
    },
    cadence: { broadcastSec: s?.location_broadcast_sec ?? 5, saveSec: s?.location_save_sec ?? 30 },
  };
}

/** The job must be this rider's current order. */
export async function riderOwnsOrder(riderId: string, orderId: string) {
  const { data } = await getServiceSupabase().from("orders").select("id, rider_id, drop_lat, drop_lng, status").eq("id", orderId).maybeSingle();
  if (!data || data.rider_id !== riderId) throw notFound("Job not found");
  return data;
}

export async function saveRiderLocation(riderId: string, p: { lat: number; lng: number; accuracy?: number | null }) {
  await getServiceSupabase()
    .from("riders")
    .update({ last_lat: p.lat, last_lng: p.lng, last_accuracy_m: p.accuracy ?? null, last_seen_at: new Date().toISOString() })
    .eq("id", riderId);
}
