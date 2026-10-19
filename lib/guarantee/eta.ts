import { haversineKm, type LatLng } from "@/lib/geo";
import type { GuaranteeSettings } from "./settings";

type SpeedSettings = Pick<GuaranteeSettings, "routeFactor" | "riderSpeedKmh">;

/** Road distance estimate: straight line × route factor (1.35). */
export function roadKm(straightKm: number, s: Pick<GuaranteeSettings, "routeFactor">): number {
  return straightKm * s.routeFactor;
}

/** Minutes to ride a straight-line distance at the rider speed (rule 6). */
export function rideMinutes(straightKm: number, s: SpeedSettings): number {
  if (s.riderSpeedKmh <= 0) return Infinity;
  return (roadKm(straightKm, s) / s.riderSpeedKmh) * 60;
}

export function rideMinutesBetween(a: LatLng, b: LatLng, s: SpeedSettings): number {
  return rideMinutes(haversineKm(a, b), s);
}

/**
 * Kitchen prep including queue penalty: the slowest item in the cart plus
 * `queuePenaltyMin` for every order already cooking in that kitchen.
 */
export function kitchenPrepMin(
  cartMaxPrepMin: number,
  ordersInKitchen: number,
  s: Pick<GuaranteeSettings, "queuePenaltyMin">,
): number {
  return Math.max(0, cartMaxPrepMin) + Math.max(0, ordersInKitchen) * s.queuePenaltyMin;
}

export type EtaBreakdown = {
  acceptBufferMin: number;
  prepMin: number;
  riderToRestaurantMin: number;
  /** max(prep, rider → restaurant) — whichever we wait on. */
  waitMin: number;
  rideMin: number;
  handoffMin: number;
  /** Unrounded sum. */
  rawMin: number;
  /** What we show and compare against max_eta_min (rounded up — never flatter ourselves). */
  totalMin: number;
  distanceKm: number;
  roadKm: number;
};

/**
 * ETA v1 (rule 6):
 *   accept buffer + max(prep incl. queue, nearest free rider → restaurant)
 *   + ride (straight line × 1.35 at 20 km/h) + handoff
 */
export function estimateEta(
  input: {
    restaurant: LatLng;
    drop: LatLng;
    prepMin: number;
    riderToRestaurantMin: number;
  },
  s: GuaranteeSettings,
): EtaBreakdown {
  const distanceKm = haversineKm(input.restaurant, input.drop);
  const rideMin = rideMinutes(distanceKm, s);
  const waitMin = Math.max(input.prepMin, input.riderToRestaurantMin);
  const rawMin = s.acceptBufferMin + waitMin + rideMin + s.handoffMin;
  return {
    acceptBufferMin: s.acceptBufferMin,
    prepMin: input.prepMin,
    riderToRestaurantMin: input.riderToRestaurantMin,
    waitMin,
    rideMin,
    handoffMin: s.handoffMin,
    rawMin,
    totalMin: Math.ceil(rawMin - 1e-9),
    distanceKm,
    roadKm: roadKm(distanceKm, s),
  };
}

/** Rain Mode: honest, longer ETA (rule 9). */
export function rainEtaMin(etaMin: number, s: Pick<GuaranteeSettings, "rainExtraMin">): number {
  return etaMin + s.rainExtraMin;
}
