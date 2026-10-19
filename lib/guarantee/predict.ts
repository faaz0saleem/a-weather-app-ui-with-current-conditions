import { haversineKm, type LatLng } from "@/lib/geo";
import { rideMinutes } from "./eta";
import type { OrderStatus } from "./outcome";
import type { GuaranteeSettings } from "./settings";

const MIN = 60_000;

export type LiveOrderForPrediction = {
  status: OrderStatus;
  restaurant: LatLng;
  drop: LatLng;
  readyBy: Date | null;
  predictedPrepMin: number;
  rider: LatLng | null;
};

/**
 * Admin live board: when do we now expect the rider to tap "Arrived"?
 * Uses current positions + the same speed model as the ETA.
 */
export function predictArrival(
  o: LiveOrderForPrediction,
  now: Date,
  s: Pick<GuaranteeSettings, "routeFactor" | "riderSpeedKmh" | "handoffMin" | "acceptBufferMin">,
): Date | null {
  const t = now.getTime();
  const ride = rideMinutes(haversineKm(o.restaurant, o.drop), s) * MIN;
  const riderToRestaurant = o.rider ? rideMinutes(haversineKm(o.rider, o.restaurant), s) * MIN : null;

  switch (o.status) {
    case "placed":
      return new Date(t + (s.acceptBufferMin + o.predictedPrepMin + s.handoffMin) * MIN + ride);
    case "accepted": {
      const ready = Math.max(o.readyBy?.getTime() ?? t, t);
      const riderAt = riderToRestaurant === null ? Infinity : t + riderToRestaurant;
      const leave = Math.max(ready, riderAt === Infinity ? ready + 10 * MIN : riderAt);
      return new Date(leave + s.handoffMin * MIN + ride);
    }
    case "ready": {
      const leave = riderToRestaurant === null ? t + 10 * MIN : t + riderToRestaurant;
      return new Date(leave + s.handoffMin * MIN + ride);
    }
    case "picked_up": {
      const remaining = o.rider ? rideMinutes(haversineKm(o.rider, o.drop), s) * MIN : ride;
      return new Date(t + remaining);
    }
    default:
      return null;
  }
}

export function isPredictedLate(predicted: Date | null, promisedBy: Date | null): boolean {
  if (!predicted || !promisedBy) return false;
  return predicted.getTime() > promisedBy.getTime();
}
