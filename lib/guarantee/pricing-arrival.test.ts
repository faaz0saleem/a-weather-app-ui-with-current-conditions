import { describe, expect, it } from "vitest";
import { checkArrival } from "./geofence";
import { isPredictedLate, predictArrival } from "./predict";
import { priceCart, type CartLineInput, type PricingMenuItem } from "./pricing";
import { riderPayoutPkr } from "./rider-pay";
import { NOON_PKT, S, Y_BLOCK, at, north } from "./test-fixtures";

const biryani: PricingMenuItem = {
  id: "biryani",
  restaurant_id: "r1",
  name: "Chicken Biryani",
  emoji: "🍛",
  price_pkr: 550,
  prep_min: 5,
  is_available: true,
  is_active: true,
  option_groups: [
    { id: "size", name: "Size", min: 1, max: 1, options: [{ id: "half", name: "Half", price_pkr: 0 }, { id: "full", name: "Full", price_pkr: 400 }] },
    { id: "extras", name: "Add-ons", min: 0, max: 2, options: [{ id: "raita", name: "Extra raita", price_pkr: 80 }, { id: "salad", name: "Salad", price_pkr: 100 }] },
  ],
};
const karahi: PricingMenuItem = { ...biryani, id: "karahi", name: "Mutton Karahi", prep_min: 25, option_groups: [] };
const menu = [biryani, karahi];
const line = (over: Partial<CartLineInput> = {}): CartLineInput => ({ itemId: "biryani", qty: 1, options: { size: ["half"] }, ...over });

describe("pricing (server-side, from the live menu)", () => {
  it("prices options and quantity, adds the delivery fee, no hidden fees", () => {
    const r = priceCart("r1", [line({ qty: 2, options: { size: ["full"], extras: ["raita"] } })], menu, S);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.lines[0].unit_price_pkr).toBe(550 + 400 + 80);
    expect(r.subtotalPkr).toBe(2060);
    expect(r.deliveryFeePkr).toBe(150);
    expect(r.totalPkr).toBe(2210);
    expect(r.maxPrepMin).toBe(5);
  });

  it("rule 8: refuses items slower than the fast lane", () => {
    expect(priceCart("r1", [line({ itemId: "karahi", options: {} })], menu, S)).toMatchObject({ ok: false, code: "item_not_fast_lane" });
  });

  it("refuses out-of-stock, unknown, other-restaurant items", () => {
    expect(priceCart("r1", [line()], [{ ...biryani, is_available: false }], S)).toMatchObject({ code: "item_out_of_stock" });
    expect(priceCart("r1", [line({ itemId: "nope" })], menu, S)).toMatchObject({ code: "item_unavailable" });
    expect(priceCart("r2", [line()], menu, S)).toMatchObject({ code: "mixed_restaurants" });
    expect(priceCart("r1", [], menu, S)).toMatchObject({ code: "empty_cart" });
  });

  it("validates required / max options and quantities", () => {
    expect(priceCart("r1", [line({ options: {} })], menu, S)).toMatchObject({ code: "bad_options" });
    expect(priceCart("r1", [line({ options: { size: ["half", "full"] } })], menu, S)).toMatchObject({ code: "bad_options" });
    expect(priceCart("r1", [line({ options: { size: ["jumbo"] } })], menu, S)).toMatchObject({ code: "bad_options" });
    expect(priceCart("r1", [line({ options: { size: ["half"], ghost: ["x"] } })], menu, S)).toMatchObject({ code: "bad_options" });
    expect(priceCart("r1", [line({ qty: 0 })], menu, S)).toMatchObject({ code: "bad_quantity" });
    expect(priceCart("r1", [line({ qty: 1.5 })], menu, S)).toMatchObject({ code: "bad_quantity" });
  });
});

describe("arrival geofence (rule 2)", () => {
  const drop = Y_BLOCK;
  it("within 75 m stops the clock, not flagged", () => {
    const r = checkArrival({ position: north(drop, 0.07), drop }, S);
    expect(r).toMatchObject({ ok: true, withinGeofence: true, flagged: false });
  });
  it("outside 75 m without a reason is refused", () => {
    const r = checkArrival({ position: north(drop, 0.2), drop }, S);
    expect(r).toMatchObject({ ok: false, code: "outside_geofence" });
  });
  it("outside with a reason is allowed but flagged for review", () => {
    const r = checkArrival({ position: north(drop, 0.2), drop, reason: "Gate is on the back street" }, S);
    expect(r).toMatchObject({ ok: true, withinGeofence: false, flagged: true });
  });
  it("no GPS: needs a reason, then flagged", () => {
    expect(checkArrival({ position: null, drop }, S)).toMatchObject({ ok: false, code: "no_gps" });
    expect(checkArrival({ position: null, drop, reason: "GPS not working" }, S)).toMatchObject({ ok: true, flagged: true });
  });
  it("blank reasons don't count", () => {
    expect(checkArrival({ position: null, drop, reason: "   " }, S)).toMatchObject({ ok: false });
  });
});

describe("rider pay (rule 11)", () => {
  it("is base + per-km × road km", () => {
    expect(riderPayoutPkr(2, S)).toBe(Math.round(120 + 20 * 2 * 1.35));
  });
  it("takes no lateness input at all", () => {
    expect(riderPayoutPkr.length).toBe(2);
  });
});

describe("admin late prediction", () => {
  it("flags a picked-up order whose rider is too far to make it", () => {
    const promisedBy = at(NOON_PKT, 5);
    const predicted = predictArrival(
      { status: "picked_up", restaurant: Y_BLOCK, drop: north(Y_BLOCK, 3), readyBy: null, predictedPrepMin: 10, rider: Y_BLOCK },
      NOON_PKT,
      S,
    );
    expect(isPredictedLate(predicted, promisedBy)).toBe(true);
    expect(isPredictedLate(predicted, at(NOON_PKT, 30))).toBe(false);
  });
  it("no prediction for finished orders", () => {
    expect(
      predictArrival({ status: "delivered", restaurant: Y_BLOCK, drop: Y_BLOCK, readyBy: null, predictedPrepMin: 5, rider: null }, NOON_PKT, S),
    ).toBeNull();
  });
});
