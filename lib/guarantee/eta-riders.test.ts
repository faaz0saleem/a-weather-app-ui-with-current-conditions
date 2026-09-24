import { describe, expect, it } from "vitest";
import { estimateEta, kitchenPrepMin, rainEtaMin, rideMinutes } from "./eta";
import { bestRiderForEta, nearestFreeRider, riderCandidates, soonestFreeInMin, type RiderSnapshot } from "./riders";
import { S, Y_BLOCK, at, idleRider, north, NOON_PKT } from "./test-fixtures";

describe("ride time (rule 6)", () => {
  it("is straight-line km × 1.35 at 20 km/h", () => {
    // 2 km straight → 2.7 km road → 8.1 min
    expect(rideMinutes(2, S)).toBeCloseTo(8.1, 6);
    expect(rideMinutes(0, S)).toBe(0);
  });
});

describe("kitchen prep with queue penalty", () => {
  it("adds queue_penalty_min per order already cooking", () => {
    expect(kitchenPrepMin(10, 0, S)).toBe(10);
    expect(kitchenPrepMin(10, 3, S)).toBe(16);
  });
});

describe("ETA v1", () => {
  it("= 2 + max(prep, rider→restaurant) + ride + 3", () => {
    const drop = north(Y_BLOCK, 2);
    const eta = estimateEta({ restaurant: Y_BLOCK, drop, prepMin: 10, riderToRestaurantMin: 4 }, S);
    expect(eta.waitMin).toBe(10);
    expect(eta.rideMin).toBeCloseTo(8.1, 3);
    expect(eta.rawMin).toBeCloseTo(2 + 10 + 8.1 + 3, 3);
    expect(eta.totalMin).toBe(24); // 23.1 rounded UP
  });

  it("waits on the rider when the rider is slower than the kitchen", () => {
    const eta = estimateEta(
      { restaurant: Y_BLOCK, drop: north(Y_BLOCK, 1), prepMin: 5, riderToRestaurantMin: 9 },
      S,
    );
    expect(eta.waitMin).toBe(9);
  });

  it("rounds exact integers without bumping them", () => {
    const eta = estimateEta({ restaurant: Y_BLOCK, drop: Y_BLOCK, prepMin: 10, riderToRestaurantMin: 0 }, S);
    expect(eta.totalMin).toBe(15);
  });

  it("rain mode adds rain_extra_min", () => {
    expect(rainEtaMin(20, S)).toBe(35);
  });
});

describe("rider candidates", () => {
  const busy = (id: string, pos: { lat: number; lng: number }, status: "picked_up" | "arrived" | "accepted", drop = pos): RiderSnapshot => ({
    id,
    status: "busy",
    isActive: true,
    position: pos,
    lastSeenAt: NOON_PKT,
    job: { status, drop },
  });

  it("ignores stale GPS, inactive and offline riders", () => {
    const riders: RiderSnapshot[] = [
      idleRider("stale", Y_BLOCK, 5), // 5 min > 120 s
      { ...idleRider("inactive", Y_BLOCK), isActive: false },
      { ...idleRider("offline", Y_BLOCK), status: "offline" },
      { ...idleRider("nogps", Y_BLOCK), position: null },
    ];
    expect(riderCandidates(riders, Y_BLOCK, NOON_PKT, S)).toEqual([]);
  });

  it("sorts idle riders nearest first", () => {
    const c = riderCandidates([idleRider("far", north(Y_BLOCK, 3)), idleRider("near", north(Y_BLOCK, 1))], Y_BLOCK, NOON_PKT, S);
    expect(c.map((x) => x.riderId)).toEqual(["near", "far"]);
    expect(c[0].availability).toBe("now");
  });

  it("counts a busy rider at the gate as 'soon' (free after handoff)", () => {
    const c = riderCandidates([busy("gate", north(Y_BLOCK, 1), "arrived")], Y_BLOCK, NOON_PKT, S);
    expect(c).toHaveLength(1);
    expect(c[0].availability).toBe("soon");
    expect(c[0].freeInMin).toBe(3);
    expect(c[0].toRestaurantMin).toBeCloseTo(3 + rideMinutes(1, S), 6);
  });

  it("counts a rider finishing a short ride, but not a long one or one going to pickup", () => {
    const shortRide = busy("short", Y_BLOCK, "picked_up", north(Y_BLOCK, 0.2)); // 0.81 + 3 min
    const longRide = busy("long", Y_BLOCK, "picked_up", north(Y_BLOCK, 3)); // 12.15 + 3 min
    const toPickup = busy("pickup", Y_BLOCK, "accepted");
    const c = riderCandidates([shortRide, longRide, toPickup], Y_BLOCK, NOON_PKT, S);
    expect(c.map((x) => x.riderId)).toEqual(["short"]);
  });

  it("bestRiderForEta skips riders already reserved by waiting orders", () => {
    const riders = [idleRider("a", north(Y_BLOCK, 0.5)), idleRider("b", north(Y_BLOCK, 1))];
    expect(bestRiderForEta(riders, Y_BLOCK, NOON_PKT, S, 0)?.riderId).toBe("a");
    expect(bestRiderForEta(riders, Y_BLOCK, NOON_PKT, S, 1)?.riderId).toBe("b");
    expect(bestRiderForEta(riders, Y_BLOCK, NOON_PKT, S, 2)).toBeNull();
  });

  it("auto-assignment only picks riders free right now", () => {
    const riders = [busy("gate", Y_BLOCK, "arrived"), idleRider("idle", north(Y_BLOCK, 2))];
    expect(nearestFreeRider(riders, Y_BLOCK, NOON_PKT, S)?.riderId).toBe("idle");
  });

  it("soonestFreeInMin finds the next rider to free up", () => {
    expect(soonestFreeInMin([busy("gate", Y_BLOCK, "arrived")], NOON_PKT, S)).toBe(3);
    expect(soonestFreeInMin([idleRider("x", Y_BLOCK)], at(NOON_PKT, 0), S)).toBeNull();
  });
});
