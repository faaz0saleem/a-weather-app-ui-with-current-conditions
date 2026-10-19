import "server-only";

import { computeOutcome, nearestFreeRider, riderPayoutPkr } from "@/lib/guarantee";
import { getServiceSupabase } from "@/lib/supabase/service";
import type { Json, Tables } from "@/lib/supabase/database.types";
import { getClock, getSettings, loadDispatchContext } from "./dispatch";
import { assignRider, SYSTEM, transition } from "./rpc";

type Order = Tables<"orders">;

/**
 * The guarantee runner. Everything here is idempotent and safe to run
 * concurrently: the database locks the row and refuses stale transitions.
 *
 *  - accept timeout      → cancel (rule 7, customer never charged)
 *  - deadline passed     → flip to free the moment it happens (rule 3)
 *  - arrived / delivered → finalise outcome + split-clock attribution (rule 10)
 *  - accepted w/o rider  → auto-assign nearest free rider
 */

const isRace = (msg?: string) =>
  !!msg && /WP:(invalid_transition|accept_window_expired|rider_busy|cannot_assign_in_status|not_late|free_is_irreversible|guarantee_off)/.test(msg);

function log(msg: string, e?: unknown) {
  console.warn(`[engine] ${msg}`, e instanceof Error ? e.message : (e ?? ""));
}

export async function cancelIfAcceptExpired(o: Pick<Order, "id" | "status" | "accept_by">, now: Date) {
  if (o.status !== "placed" || new Date(o.accept_by).getTime() >= now.getTime()) return false;
  const { error } = await transition(o.id, "cancelled", SYSTEM, { reason: "restaurant_timeout" }, { source: "engine" });
  if (error && !isRace(error.message)) log(`cancel ${o.id}`, error);
  return !error;
}

/** Decide + write the guarantee outcome for one order (on DB time). */
export async function applyOutcome(o: Order, now: Date) {
  const s = await getSettings();
  const patch = computeOutcome(
    {
      status: o.status,
      guaranteeActive: o.guarantee_active,
      currentState: o.guarantee_state,
      finalized: !!o.outcome_finalized_at,
      promisedBy: o.promised_by ? new Date(o.promised_by) : null,
      acceptedAt: o.accepted_at ? new Date(o.accepted_at) : null,
      committedPrepMin: o.committed_prep_min,
      readyAt: o.ready_at ? new Date(o.ready_at) : null,
      arrivedAt: o.arrived_at ? new Date(o.arrived_at) : null,
      plannedDeliveryMin: Number(o.planned_delivery_min),
      totalPkr: o.total_pkr,
      freeCapPkr: o.free_cap_pkr,
      now,
    },
    s,
  );
  if (!patch) return null;
  const { data, error } = await getServiceSupabase().rpc("apply_guarantee_outcome", {
    p_order_id: o.id,
    p: patch as unknown as Json,
  });
  if (error) {
    if (!isRace(error.message)) log(`outcome ${o.id}`, error);
    return null;
  }
  return data;
}

/** Nearest free rider → assign (system). Pay is fixed now and never reduced (rule 11). */
export async function tryAssignRider(o: Pick<Order, "id" | "status" | "rider_id" | "restaurant_id" | "drop_lat" | "drop_lng" | "distance_km">) {
  if (o.rider_id || !["accepted", "ready"].includes(o.status)) return null;
  const sb = getServiceSupabase();
  const [ctx, { data: r }] = await Promise.all([
    loadDispatchContext(),
    sb.from("restaurants").select("lat, lng").eq("id", o.restaurant_id).single(),
  ]);
  if (!r) return null;
  const pick = nearestFreeRider(ctx.riders, { lat: r.lat, lng: r.lng }, ctx.now, ctx.settings);
  if (!pick) return null;
  const { data, error } = await assignRider(o.id, pick.riderId, SYSTEM, riderPayoutPkr(Number(o.distance_km), ctx.settings));
  if (error) {
    if (!isRace(error.message)) log(`assign ${o.id}`, error);
    return null;
  }
  return data;
}

/** Bring one order up to date with the clock. Called on reads and after every transition. */
export async function evaluateOrder(orderId: string): Promise<Order | null> {
  const sb = getServiceSupabase();
  const [{ data: order }, clock] = await Promise.all([sb.from("orders").select("*").eq("id", orderId).maybeSingle(), getClock()]);
  if (!order) return null;
  let o = order;
  if (await cancelIfAcceptExpired(o, clock.now)) {
    o = (await sb.from("orders").select("*").eq("id", orderId).single()).data ?? o;
  }
  const updated = await applyOutcome(o, clock.now);
  if (updated) o = updated;
  if (!o.rider_id && (o.status === "accepted" || o.status === "ready")) {
    const assigned = await tryAssignRider(o);
    if (assigned) o = assigned;
  }
  return o;
}

let running = false;

/** One sweep over everything the clock has touched. */
export async function sweep(): Promise<{ checked: number }> {
  if (running) return { checked: 0 };
  running = true;
  try {
    const sb = getServiceSupabase();
    const { data: candidates, error } = await sb.rpc("sweep_candidates");
    if (error) {
      log("sweep_candidates", error);
      return { checked: 0 };
    }
    const ids = [...new Set((candidates ?? []).map((c) => c.order_id))];
    for (const id of ids) {
      try {
        await evaluateOrder(id);
      } catch (e) {
        log(`evaluate ${id}`, e);
      }
    }
    return { checked: ids.length };
  } finally {
    running = false;
  }
}
