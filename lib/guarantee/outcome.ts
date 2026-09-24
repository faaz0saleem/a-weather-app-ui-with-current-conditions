import type { GuaranteeSettings } from "./settings";

export type GuaranteeState = "active" | "on_time" | "free" | "off" | "void";
export type LateCause = "kitchen" | "delivery";
export type OrderStatus =
  | "placed"
  | "accepted"
  | "ready"
  | "picked_up"
  | "arrived"
  | "delivered"
  | "rejected"
  | "cancelled";

const MIN = 60_000;

/**
 * Rule 3: late = not arrived by promised_by. Arrival exactly at the deadline
 * is on time; the deadline instant itself with no arrival is late ("the second
 * the deadline passes").
 */
export function isLate(p: { promisedBy: Date; arrivedAt: Date | null; now: Date }): boolean {
  if (p.arrivedAt) return p.arrivedAt.getTime() > p.promisedBy.getTime();
  return p.now.getTime() >= p.promisedBy.getTime();
}

/** Free up to the cap. */
export function freeAmountPkr(totalPkr: number, capPkr: number): number {
  return Math.max(0, Math.min(totalPkr, capPkr));
}

/** COD: rider collects Rs 0, or only what's above the cap. */
export function amountToCollectPkr(totalPkr: number, freePkr: number): number {
  return Math.max(0, totalPkr - freePkr);
}

export type Attribution = {
  cause: LateCause;
  kitchenOverrunSec: number;
  deliveryOverrunSec: number;
};

/**
 * Rule 10 — split clock.
 *   kitchen overrun  = ready_at − (accepted_at + committed_prep)
 *   delivery overrun = (arrived_at − ready_at) − planned delivery (ride + handoff)
 * Bigger overrun wins. Ties, or no measurable overrun (our ETA was simply
 * wrong), go to delivery — the platform absorbs its own misses (D8).
 */
export function attributeLateness(p: {
  acceptedAt: Date | null;
  committedPrepMin: number | null;
  readyAt: Date | null;
  arrivedAt: Date;
  plannedDeliveryMin: number;
}): Attribution {
  let kitchenOverrunSec = 0;
  let deliveryOverrunSec = 0;

  if (p.acceptedAt && p.committedPrepMin != null && p.readyAt) {
    const readyBy = p.acceptedAt.getTime() + p.committedPrepMin * MIN;
    kitchenOverrunSec = Math.max(0, Math.round((p.readyAt.getTime() - readyBy) / 1000));
  }
  if (p.readyAt) {
    const deliveryMs = p.arrivedAt.getTime() - p.readyAt.getTime();
    deliveryOverrunSec = Math.max(0, Math.round((deliveryMs - p.plannedDeliveryMin * MIN) / 1000));
  }

  const cause: LateCause = kitchenOverrunSec > deliveryOverrunSec ? "kitchen" : "delivery";
  return { cause, kitchenOverrunSec, deliveryOverrunSec };
}

/** Kitchen-caused lates are charged to the restaurant (rule 10). */
export function restaurantChargePkr(freePkr: number, cause: LateCause | null, kitchenChargePct: number): number {
  if (cause !== "kitchen") return 0;
  return Math.round((freePkr * Math.min(100, Math.max(0, kitchenChargePct))) / 100);
}

export type OutcomeInput = {
  status: OrderStatus;
  guaranteeActive: boolean;
  currentState: GuaranteeState;
  finalized: boolean;
  promisedBy: Date | null;
  acceptedAt: Date | null;
  committedPrepMin: number | null;
  readyAt: Date | null;
  arrivedAt: Date | null;
  plannedDeliveryMin: number;
  totalPkr: number;
  freeCapPkr: number;
  /** DB time. */
  now: Date;
};

export type OutcomePatch = {
  guarantee_state: GuaranteeState;
  free_amount_pkr: number;
  late_by_sec: number | null;
  late_cause: LateCause | null;
  kitchen_overrun_sec: number | null;
  delivery_overrun_sec: number | null;
  restaurant_charge_pkr: number;
  finalize: boolean;
};

const ARRIVED: OrderStatus[] = ["arrived", "delivered"];
const IN_FLIGHT: OrderStatus[] = ["placed", "accepted", "ready", "picked_up"];

/**
 * Decide what the order's guarantee outcome should be *now*.
 * Returns null when nothing needs writing. The DB (apply_guarantee_outcome)
 * re-checks the clock and refuses anything inconsistent.
 */
export function computeOutcome(
  o: OutcomeInput,
  s: Pick<GuaranteeSettings, "kitchenChargePct">,
): OutcomePatch | null {
  const arrived = ARRIVED.includes(o.status) && o.arrivedAt;

  // No clock (Rain Mode) or already void: only close the books on arrival.
  if (!o.guaranteeActive || !o.promisedBy || o.currentState === "void" || o.currentState === "off") {
    if (arrived && !o.finalized) return keep(o.currentState, true);
    return null;
  }

  if (arrived && o.arrivedAt) {
    if (o.finalized) return null;
    const late = o.currentState === "free" || isLate({ promisedBy: o.promisedBy, arrivedAt: o.arrivedAt, now: o.now });
    if (!late) return keep("on_time", true);

    const free = freeAmountPkr(o.totalPkr, o.freeCapPkr);
    const att = attributeLateness({
      acceptedAt: o.acceptedAt,
      committedPrepMin: o.committedPrepMin,
      readyAt: o.readyAt,
      arrivedAt: o.arrivedAt,
      plannedDeliveryMin: o.plannedDeliveryMin,
    });
    return {
      guarantee_state: "free",
      free_amount_pkr: free,
      late_by_sec: Math.max(0, Math.round((o.arrivedAt.getTime() - o.promisedBy.getTime()) / 1000)),
      late_cause: att.cause,
      kitchen_overrun_sec: att.kitchenOverrunSec,
      delivery_overrun_sec: att.deliveryOverrunSec,
      restaurant_charge_pkr: restaurantChargePkr(free, att.cause, s.kitchenChargePct),
      finalize: true,
    };
  }

  // Still on the way: flip to free the moment the deadline passes (once).
  if (IN_FLIGHT.includes(o.status) && o.currentState === "active") {
    if (!isLate({ promisedBy: o.promisedBy, arrivedAt: null, now: o.now })) return null;
    return {
      guarantee_state: "free",
      free_amount_pkr: freeAmountPkr(o.totalPkr, o.freeCapPkr),
      late_by_sec: Math.max(0, Math.round((o.now.getTime() - o.promisedBy.getTime()) / 1000)),
      late_cause: null,
      kitchen_overrun_sec: null,
      delivery_overrun_sec: null,
      restaurant_charge_pkr: 0,
      finalize: false,
    };
  }

  return null;
}

function keep(state: GuaranteeState, finalize: boolean): OutcomePatch {
  return {
    guarantee_state: state,
    free_amount_pkr: 0,
    late_by_sec: null,
    late_cause: null,
    kitchen_overrun_sec: null,
    delivery_overrun_sec: null,
    restaurant_charge_pkr: 0,
    finalize,
  };
}
