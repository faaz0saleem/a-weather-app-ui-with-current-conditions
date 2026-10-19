import { describe, expect, it } from "vitest";
import { checkEligibility, type EligibilityInput } from "./eligibility";
import { rideMinutes } from "./eta";
import { DHA_ZONE, NOON_PKT, S, Y_BLOCK, at, east, idleRider, north } from "./test-fixtures";

function input(over: Partial<EligibilityInput> = {}): EligibilityInput {
  return {
    now: NOON_PKT,
    settings: S,
    zones: [DHA_ZONE],
    restaurant: {
      id: "r1",
      lat: Y_BLOCK.lat,
      lng: Y_BLOCK.lng,
      radiusKm: null,
      opensAt: "11:00",
      closesAt: "02:00",
      isActive: true,
      isAccepting: true,
      pausedUntil: null,
    },
    drop: north(Y_BLOCK, 2),
    cartMaxPrepMin: 10,
    ordersInKitchen: 0,
    riders: [idleRider("rider-1", north(Y_BLOCK, 0.5))],
    reservedRiders: 0,
    ...over,
  };
}

describe("eligibility (rule 5)", () => {
  it("accepts a normal order with the guarantee and the right ETA", () => {
    const r = checkEligibility(input());
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.guarantee).toBe("active");
    expect(r.rider.riderId).toBe("rider-1");
    // 2 + max(10, 2.03) + 8.1 + 3 = 23.1 → 24
    expect(r.etaMin).toBe(24);
  });

  it("refuses inactive restaurants", () => {
    const r = checkEligibility(input({ restaurant: { ...input().restaurant, isActive: false } }));
    expect(r).toMatchObject({ ok: false, code: "restaurant_inactive" });
  });

  it("refuses pins outside the DHA zone", () => {
    const r = checkEligibility(input({ drop: { lat: 31.52, lng: 74.35 } }));
    expect(r).toMatchObject({ ok: false, code: "outside_zone", retryInMin: null });
  });

  it("refuses pins beyond the restaurant radius (default 4 km, per-restaurant override)", () => {
    const far = checkEligibility(input({ drop: east(Y_BLOCK, 4.2) }));
    expect(far).toMatchObject({ ok: false, code: "too_far" });
    if (!far.ok) expect(far.detail.radiusKm).toBe(4);

    const tight = checkEligibility(input({ restaurant: { ...input().restaurant, radiusKm: 1.5 } }));
    expect(tight).toMatchObject({ ok: false, code: "too_far" });
  });

  it("refuses when closed and says when it opens", () => {
    const r = checkEligibility(input({ now: new Date("2026-09-24T05:15:00Z") })); // 10:15 PKT
    expect(r).toMatchObject({ ok: false, code: "closed", retryInMin: 45 });
  });

  it("refuses when the restaurant switched itself off", () => {
    const r = checkEligibility(input({ restaurant: { ...input().restaurant, isAccepting: false } }));
    expect(r).toMatchObject({ ok: false, code: "not_accepting" });
  });

  it("refuses when paused and says when they're back", () => {
    const r = checkEligibility(input({ restaurant: { ...input().restaurant, pausedUntil: at(NOON_PKT, 9.5) } }));
    expect(r).toMatchObject({ ok: false, code: "paused", retryInMin: 10 });
  });

  it("an expired pause doesn't block", () => {
    const r = checkEligibility(input({ restaurant: { ...input().restaurant, pausedUntil: at(NOON_PKT, -1) } }));
    expect(r.ok).toBe(true);
  });

  it("refuses when no rider is free now or within ~5 min", () => {
    const r = checkEligibility(input({ riders: [] }));
    expect(r).toMatchObject({ ok: false, code: "no_rider" });
    if (!r.ok) expect(r.retryInMin).toBeGreaterThanOrEqual(5);
  });

  it("refuses when every free rider is already reserved", () => {
    const r = checkEligibility(input({ reservedRiders: 1 }));
    expect(r).toMatchObject({ ok: false, code: "no_rider" });
  });

  it("accepts ETA exactly at the 25-min limit, refuses 26", () => {
    // ride for distance d: 2 + 10 + ride + 3 = 25 → ride = 10 min → d = 10*20/60/1.35 km
    const d25 = (10 * S.riderSpeedKmh) / 60 / S.routeFactor;
    const ok = checkEligibility(input({ drop: north(Y_BLOCK, d25 - 0.001) }));
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(ok.etaMin).toBe(25);

    const tooLong = checkEligibility(input({ drop: north(Y_BLOCK, d25 + 0.05), cartMaxPrepMin: 10 }));
    expect(tooLong).toMatchObject({ ok: false, code: "eta_too_long", retryInMin: null });
  });

  it("blames a slammed kitchen and suggests when to retry", () => {
    const r = checkEligibility(input({ ordersInKitchen: 5 })); // prep 10 + 10 queue
    expect(r).toMatchObject({ ok: false, code: "kitchen_busy", retryInMin: 10 });
  });

  it("blames stretched riders when the only rider is far away", () => {
    const farRider = idleRider("far", north(Y_BLOCK, 3.9)); // ~15.8 min to kitchen
    expect(rideMinutes(3.9, S)).toBeGreaterThan(10);
    const r = checkEligibility(input({ riders: [farRider] }));
    expect(r).toMatchObject({ ok: false, code: "riders_busy", retryInMin: 5 });
  });

  it("Rain Mode: allowed, no timer, honest longer ETA, no 25-min cap", () => {
    const rain = { ...S, rainMode: true };
    const r = checkEligibility(input({ settings: rain, ordersInKitchen: 5 }));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.guarantee).toBe("off");
    expect(r.etaMin).toBe(r.eta.totalMin + rain.rainExtraMin);
  });

  it("Rain Mode still refuses outside the zone", () => {
    const r = checkEligibility(input({ settings: { ...S, rainMode: true }, drop: { lat: 31.6, lng: 74.3 } }));
    expect(r).toMatchObject({ ok: false, code: "outside_zone" });
  });
});
