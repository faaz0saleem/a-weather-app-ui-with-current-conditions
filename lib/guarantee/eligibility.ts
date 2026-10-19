import { haversineKm, pointInPolygon, type LatLng, type Polygon } from "@/lib/geo";
import { estimateEta, kitchenPrepMin, rainEtaMin, type EtaBreakdown } from "./eta";
import { isOpenAt, minutesUntilOpen } from "./hours";
import { bestRiderForEta, soonestFreeInMin, type RiderCandidate, type RiderSnapshot } from "./riders";
import type { GuaranteeSettings } from "./settings";

export type EligibilityRestaurant = {
  id: string;
  lat: number;
  lng: number;
  radiusKm: number | null;
  opensAt: string;
  closesAt: string;
  isActive: boolean;
  isAccepting: boolean;
  pausedUntil: Date | null;
};

export type EligibilityInput = {
  /** DB time (app_now) — never the device clock. */
  now: Date;
  settings: GuaranteeSettings;
  /** Active zone polygons. The drop must be inside at least one. */
  zones: Polygon[];
  restaurant: EligibilityRestaurant;
  drop: LatLng;
  /** Slowest item in the cart (or a typical fast-lane prep for browse ETAs). */
  cartMaxPrepMin: number;
  /** Orders this kitchen has accepted but not finished. */
  ordersInKitchen: number;
  riders: RiderSnapshot[];
  /** Orders already waiting for a rider (each will take one). */
  reservedRiders: number;
};

export type IneligibleCode =
  | "restaurant_inactive"
  | "outside_zone"
  | "too_far"
  | "closed"
  | "not_accepting"
  | "paused"
  | "no_rider"
  | "kitchen_busy"
  | "riders_busy"
  | "eta_too_long";

export type EligibilityResult =
  | {
      ok: true;
      /** 'active' = ⚡ guaranteed · 'off' = Rain Mode, no timer. */
      guarantee: "active" | "off";
      eta: EtaBreakdown;
      /** The ETA we show the customer (Rain Mode adds rain_extra_min). */
      etaMin: number;
      rider: RiderCandidate;
      prepMin: number;
    }
  | {
      ok: false;
      code: IneligibleCode;
      /** "Try again in ~X min" — null when waiting won't help. */
      retryInMin: number | null;
      detail: { distanceKm?: number; radiusKm?: number; etaMin?: number; maxEtaMin?: number };
    };

const roundUpTo5 = (n: number) => Math.max(5, Math.ceil(n / 5) * 5);

/**
 * Rule 5: can we take this order (and promise it)? Checks run cheapest-first
 * and the first failure wins, so the customer gets the most useful reason.
 */
export function checkEligibility(input: EligibilityInput): EligibilityResult {
  const { now, settings: s, restaurant: r, drop } = input;
  const restaurantPoint = { lat: r.lat, lng: r.lng };

  if (!r.isActive) return fail("restaurant_inactive", null);

  if (!input.zones.some((z) => pointInPolygon(drop, z))) return fail("outside_zone", null);

  const distanceKm = haversineKm(restaurantPoint, drop);
  const radiusKm = r.radiusKm ?? s.restaurantRadiusKm;
  if (distanceKm > radiusKm) return fail("too_far", null, { distanceKm, radiusKm });

  if (!isOpenAt(r.opensAt, r.closesAt, now))
    return fail("closed", minutesUntilOpen(r.opensAt, r.closesAt, now));

  if (!r.isAccepting) return fail("not_accepting", null);

  if (r.pausedUntil && r.pausedUntil.getTime() > now.getTime())
    return fail("paused", Math.max(1, Math.ceil((r.pausedUntil.getTime() - now.getTime()) / 60000)));

  const rider = bestRiderForEta(input.riders, restaurantPoint, now, s, input.reservedRiders);
  if (!rider) {
    const soonest = soonestFreeInMin(input.riders, now, s);
    return fail("no_rider", roundUpTo5(soonest ?? s.riderSoonFreeMin * 2));
  }

  const prepMin = kitchenPrepMin(input.cartMaxPrepMin, input.ordersInKitchen, s);
  const eta = estimateEta(
    { restaurant: restaurantPoint, drop, prepMin, riderToRestaurantMin: rider.toRestaurantMin },
    s,
  );

  // Rule 9: Rain Mode — allowed, no timer, honest longer ETA.
  if (s.rainMode) {
    return { ok: true, guarantee: "off", eta, etaMin: rainEtaMin(eta.totalMin, s), rider, prepMin };
  }

  // Rule 5: predicted ETA must leave the safety buffer.
  if (eta.totalMin > s.maxEtaMin) {
    const detail = { etaMin: eta.totalMin, maxEtaMin: s.maxEtaMin };
    const kitchenBound = eta.prepMin >= eta.riderToRestaurantMin && input.ordersInKitchen > 0;
    if (kitchenBound) {
      // Would an empty queue fix it? Then it's the kitchen, and the queue drains.
      const withoutQueue = eta.rawMin - (eta.waitMin - Math.max(input.cartMaxPrepMin, eta.riderToRestaurantMin));
      if (Math.ceil(withoutQueue - 1e-9) <= s.maxEtaMin)
        return fail("kitchen_busy", roundUpTo5(input.ordersInKitchen * s.queuePenaltyMin), detail);
    }
    if (eta.riderToRestaurantMin > eta.prepMin) {
      // Would a rider already waiting at the kitchen fix it? Then riders are just stretched.
      const withRiderReady = eta.rawMin - eta.waitMin + eta.prepMin;
      if (Math.ceil(withRiderReady - 1e-9) <= s.maxEtaMin) return fail("riders_busy", 5, detail);
    }
    return fail("eta_too_long", null, detail);
  }

  return { ok: true, guarantee: "active", eta, etaMin: eta.totalMin, rider, prepMin };
}

function fail(
  code: IneligibleCode,
  retryInMin: number | null,
  detail: Extract<EligibilityResult, { ok: false }>["detail"] = {},
): EligibilityResult {
  return { ok: false, code, retryInMin, detail };
}
