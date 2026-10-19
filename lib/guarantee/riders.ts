import { haversineKm, type LatLng } from "@/lib/geo";
import { rideMinutes } from "./eta";
import type { GuaranteeSettings } from "./settings";

export type RiderJobSnapshot = {
  status: "placed" | "accepted" | "ready" | "picked_up" | "arrived" | "delivered" | "rejected" | "cancelled";
  drop: LatLng;
};

export type RiderSnapshot = {
  id: string;
  status: "offline" | "idle" | "busy";
  isActive: boolean;
  position: LatLng | null;
  lastSeenAt: Date | null;
  job: RiderJobSnapshot | null;
};

export type RiderCandidate = {
  riderId: string;
  /** 'now' = idle; 'soon' = finishing a drop within rider_soon_free_min. */
  availability: "now" | "soon";
  /** Minutes until this rider could be at the restaurant. */
  toRestaurantMin: number;
  /** Minutes until the rider is free (0 for idle riders). */
  freeInMin: number;
};

type RiderSettings = Pick<
  GuaranteeSettings,
  "riderStaleSec" | "riderSoonFreeMin" | "handoffMin" | "routeFactor" | "riderSpeedKmh"
>;

/** A rider counts only if their GPS is recent. */
export function isFresh(r: RiderSnapshot, now: Date, s: Pick<GuaranteeSettings, "riderStaleSec">): boolean {
  if (!r.position || !r.lastSeenAt) return false;
  return now.getTime() - r.lastSeenAt.getTime() <= s.riderStaleSec * 1000;
}

/**
 * Every rider who could serve a new order at `restaurant`, fastest first.
 * - idle + fresh GPS → available now
 * - busy and at the customer's gate (arrived) → free after handoff
 * - busy and riding to the drop → free after the remaining ride + handoff
 * Busy riders count only if they'll be free within rider_soon_free_min (D10).
 */
export function riderCandidates(
  riders: RiderSnapshot[],
  restaurant: LatLng,
  now: Date,
  s: RiderSettings,
): RiderCandidate[] {
  const out: RiderCandidate[] = [];
  for (const r of riders) {
    if (!r.isActive || !isFresh(r, now, s) || !r.position) continue;

    if (r.status === "idle") {
      out.push({
        riderId: r.id,
        availability: "now",
        freeInMin: 0,
        toRestaurantMin: rideMinutes(haversineKm(r.position, restaurant), s),
      });
      continue;
    }

    if (r.status === "busy" && r.job) {
      let freeInMin: number | null = null;
      if (r.job.status === "arrived") freeInMin = s.handoffMin;
      else if (r.job.status === "picked_up")
        freeInMin = rideMinutes(haversineKm(r.position, r.job.drop), s) + s.handoffMin;

      if (freeInMin !== null && freeInMin <= s.riderSoonFreeMin) {
        out.push({
          riderId: r.id,
          availability: "soon",
          freeInMin,
          toRestaurantMin: freeInMin + rideMinutes(haversineKm(r.job.drop, restaurant), s),
        });
      }
    }
  }
  return out.sort((a, b) => a.toRestaurantMin - b.toRestaurantMin);
}

/**
 * The rider an ETA quote should assume. `reserved` = orders already waiting
 * for a rider; each will take one, so we skip that many candidates (D25).
 */
export function bestRiderForEta(
  riders: RiderSnapshot[],
  restaurant: LatLng,
  now: Date,
  s: RiderSettings,
  reserved = 0,
): RiderCandidate | null {
  return riderCandidates(riders, restaurant, now, s)[Math.max(0, reserved)] ?? null;
}

/** Auto-assignment: the nearest rider who is free right now. */
export function nearestFreeRider(
  riders: RiderSnapshot[],
  restaurant: LatLng,
  now: Date,
  s: RiderSettings,
): RiderCandidate | null {
  return riderCandidates(riders, restaurant, now, s).find((c) => c.availability === "now") ?? null;
}

/** Soonest time (minutes) any busy rider frees up — used for "try again in ~X min". */
export function soonestFreeInMin(riders: RiderSnapshot[], now: Date, s: RiderSettings): number | null {
  let best: number | null = null;
  for (const r of riders) {
    if (!r.isActive || r.status !== "busy" || !r.job || !r.position || !isFresh(r, now, s)) continue;
    let freeIn: number | null = null;
    if (r.job.status === "arrived") freeIn = s.handoffMin;
    else if (r.job.status === "picked_up")
      freeIn = rideMinutes(haversineKm(r.position, r.job.drop), s) + s.handoffMin;
    if (freeIn !== null && (best === null || freeIn < best)) best = freeIn;
  }
  return best;
}
