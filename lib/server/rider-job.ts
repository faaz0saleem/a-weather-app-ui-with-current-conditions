import "server-only";

/**
 * Rule 11 — riders never see the customer's countdown. This is the ONLY shape
 * rider-facing code receives about an order. It is built field-by-field from
 * an allow-list, so deadline/guarantee/lateness data can't leak by accident.
 * (rider-job.test.ts enforces this.)
 */
export type RiderJob = {
  id: string;
  code: string;
  status: "accepted" | "ready" | "picked_up" | "arrived" | "delivered" | "cancelled" | "rejected" | "placed";
  pickup: { name: string; address: string; lat: number; lng: number; phone: string | null };
  drop: { address: string; lat: number; lng: number; gateNote: string | null };
  customer: { name: string; phone: string | null };
  items: { name: string; qty: number }[];
  itemCount: number;
  /** Cash to collect at the door (0 when WaqtPe covers it). */
  collectPkr: number;
  /** True when part/all of the bill is covered — shown neutrally as "Paid by WaqtPe". */
  coveredByWaqtpe: boolean;
  payoutPkr: number;
  distanceKm: number;
  note: string | null;
};

/** Keys that must never appear in anything sent to a rider. */
export const RIDER_FORBIDDEN_KEYS = [
  "promised_by",
  "promisedBy",
  "guarantee_state",
  "guaranteeState",
  "guarantee_active",
  "late_by_sec",
  "lateBySec",
  "late_cause",
  "window_min",
  "accept_by",
  "free_amount_pkr",
  "predicted_eta_min",
  "deadline",
  "countdown",
];

type OrderLike = {
  id: string;
  code: string;
  status: RiderJob["status"];
  drop_address: string;
  drop_lat: number;
  drop_lng: number;
  drop_gate_note: string | null;
  customer_name: string;
  customer_phone: string | null;
  customer_note: string | null;
  amount_to_collect_pkr: number;
  total_pkr: number;
  rider_payout_pkr: number;
  distance_km: number | string;
};

export function toRiderJob(
  o: OrderLike,
  restaurant: { name: string; address: string; lat: number; lng: number; phone: string | null },
  items: { name: string; qty: number }[],
): RiderJob {
  return {
    id: o.id,
    code: o.code,
    status: o.status,
    pickup: { name: restaurant.name, address: restaurant.address, lat: restaurant.lat, lng: restaurant.lng, phone: restaurant.phone },
    drop: { address: o.drop_address, lat: o.drop_lat, lng: o.drop_lng, gateNote: o.drop_gate_note },
    customer: { name: o.customer_name.split(" ")[0] || "Customer", phone: o.customer_phone },
    items: items.map((i) => ({ name: i.name, qty: i.qty })),
    itemCount: items.reduce((n, i) => n + i.qty, 0),
    collectPkr: o.amount_to_collect_pkr,
    coveredByWaqtpe: o.amount_to_collect_pkr < o.total_pkr,
    payoutPkr: o.rider_payout_pkr,
    distanceKm: Number(o.distance_km),
    note: o.customer_note,
  };
}
