import { describe, expect, it } from "vitest";
import {
  amountToCollectPkr,
  attributeLateness,
  computeOutcome,
  freeAmountPkr,
  isLate,
  restaurantChargePkr,
  type OutcomeInput,
} from "./outcome";
import { NOON_PKT, S, at } from "./test-fixtures";

const placed = NOON_PKT;
const promisedBy = at(placed, 30);

function order(over: Partial<OutcomeInput> = {}): OutcomeInput {
  return {
    status: "picked_up",
    guaranteeActive: true,
    currentState: "active",
    finalized: false,
    promisedBy,
    acceptedAt: at(placed, 1),
    committedPrepMin: 10,
    readyAt: at(placed, 11),
    arrivedAt: null,
    plannedDeliveryMin: 11,
    totalPkr: 1250,
    freeCapPkr: 3000,
    now: at(placed, 20),
    ...over,
  };
}

describe("isLate (rule 3)", () => {
  it("arrival at or before the deadline is on time", () => {
    expect(isLate({ promisedBy, arrivedAt: at(placed, 29.99), now: at(placed, 40) })).toBe(false);
    expect(isLate({ promisedBy, arrivedAt: promisedBy, now: at(placed, 40) })).toBe(false);
  });
  it("arrival one second after is late", () => {
    expect(isLate({ promisedBy, arrivedAt: new Date(promisedBy.getTime() + 1000), now: at(placed, 40) })).toBe(true);
  });
  it("no arrival: late the instant the deadline passes", () => {
    expect(isLate({ promisedBy, arrivedAt: null, now: new Date(promisedBy.getTime() - 1) })).toBe(false);
    expect(isLate({ promisedBy, arrivedAt: null, now: promisedBy })).toBe(true);
  });
});

describe("free amount + cash to collect", () => {
  it("is the whole order under the cap", () => {
    expect(freeAmountPkr(1250, 3000)).toBe(1250);
    expect(amountToCollectPkr(1250, 1250)).toBe(0);
  });
  it("caps at Rs 3,000 — rider collects only the excess", () => {
    expect(freeAmountPkr(4200, 3000)).toBe(3000);
    expect(amountToCollectPkr(4200, 3000)).toBe(1200);
  });
  it("cap of 0 means nothing free", () => {
    expect(freeAmountPkr(1250, 0)).toBe(0);
  });
});

describe("split clock attribution (rule 10)", () => {
  const base = { acceptedAt: at(placed, 1), committedPrepMin: 10, plannedDeliveryMin: 11 };

  it("kitchen overran more → kitchen", () => {
    // ready 8 min late; delivery 2 min over
    const a = attributeLateness({ ...base, readyAt: at(placed, 19), arrivedAt: at(placed, 32) });
    expect(a.kitchenOverrunSec).toBe(8 * 60);
    expect(a.deliveryOverrunSec).toBe(2 * 60);
    expect(a.cause).toBe("kitchen");
  });

  it("delivery overran more → delivery", () => {
    const a = attributeLateness({ ...base, readyAt: at(placed, 12), arrivedAt: at(placed, 31) });
    expect(a.kitchenOverrunSec).toBe(60);
    expect(a.deliveryOverrunSec).toBe(8 * 60);
    expect(a.cause).toBe("delivery");
  });

  it("tie → delivery (platform absorbs)", () => {
    const a = attributeLateness({ ...base, readyAt: at(placed, 14), arrivedAt: at(placed, 28) });
    expect(a.kitchenOverrunSec).toBe(a.deliveryOverrunSec);
    expect(a.cause).toBe("delivery");
  });

  it("nobody overran (our ETA was wrong) → delivery, never kitchen", () => {
    const a = attributeLateness({ ...base, readyAt: at(placed, 11), arrivedAt: at(placed, 22) });
    expect(a).toEqual({ cause: "delivery", kitchenOverrunSec: 0, deliveryOverrunSec: 0 });
  });

  it("kitchen charge only for kitchen lates", () => {
    expect(restaurantChargePkr(1250, "kitchen", 100)).toBe(1250);
    expect(restaurantChargePkr(1250, "kitchen", 50)).toBe(625);
    expect(restaurantChargePkr(1250, "delivery", 100)).toBe(0);
    expect(restaurantChargePkr(1250, null, 100)).toBe(0);
  });
});

describe("computeOutcome", () => {
  it("nothing to do while the clock is running", () => {
    expect(computeOutcome(order(), S)).toBeNull();
  });

  it("flips to free the second the deadline passes (not finalized yet)", () => {
    const p = computeOutcome(order({ now: promisedBy }), S);
    expect(p).toMatchObject({ guarantee_state: "free", free_amount_pkr: 1250, finalize: false, late_cause: null });
  });

  it("doesn't re-flip an order that's already free", () => {
    expect(computeOutcome(order({ currentState: "free", now: at(placed, 35) }), S)).toBeNull();
  });

  it("arrived on time → on_time, finalized", () => {
    const p = computeOutcome(order({ status: "arrived", arrivedAt: at(placed, 24), now: at(placed, 24) }), S);
    expect(p).toMatchObject({ guarantee_state: "on_time", free_amount_pkr: 0, finalize: true });
  });

  it("arrived late → free, attributed, kitchen charged when it's the kitchen's fault", () => {
    const p = computeOutcome(
      order({ status: "arrived", readyAt: at(placed, 20), arrivedAt: at(placed, 33), now: at(placed, 33), totalPkr: 4200 }),
      S,
    );
    expect(p).toMatchObject({
      guarantee_state: "free",
      free_amount_pkr: 3000,
      late_by_sec: 180,
      late_cause: "kitchen",
      kitchen_overrun_sec: 9 * 60,
      restaurant_charge_pkr: 3000,
      finalize: true,
    });
  });

  it("free is irreversible: an already-free order stays free on arrival", () => {
    const p = computeOutcome(
      order({ status: "arrived", currentState: "free", arrivedAt: at(placed, 31), now: at(placed, 31) }),
      S,
    );
    expect(p?.guarantee_state).toBe("free");
  });

  it("finalized orders are left alone", () => {
    expect(computeOutcome(order({ status: "delivered", arrivedAt: at(placed, 20), finalized: true }), S)).toBeNull();
  });

  it("Rain Mode orders are never free — just closed on arrival", () => {
    const rain = order({ guaranteeActive: false, promisedBy: null, currentState: "off" });
    expect(computeOutcome({ ...rain, now: at(placed, 90) }, S)).toBeNull();
    const p = computeOutcome({ ...rain, status: "arrived", arrivedAt: at(placed, 50), now: at(placed, 50) }, S);
    expect(p).toMatchObject({ guarantee_state: "off", free_amount_pkr: 0, finalize: true });
  });

  it("void (cancelled) orders never become free", () => {
    expect(computeOutcome(order({ status: "cancelled", currentState: "void", now: at(placed, 60) }), S)).toBeNull();
  });
});
