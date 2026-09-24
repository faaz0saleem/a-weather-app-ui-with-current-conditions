import { haversineM, type LatLng } from "@/lib/geo";
import type { GuaranteeSettings } from "./settings";

export type ArrivalCheck =
  | { ok: true; withinGeofence: true; distanceM: number; flagged: false }
  | { ok: true; withinGeofence: false; distanceM: number | null; flagged: true; reason: string }
  | { ok: false; code: "outside_geofence" | "no_gps"; distanceM: number | null; geofenceM: number };

/**
 * Rule 2: the clock stops on "Arrived" only within the geofence (75 m) of the
 * delivery pin. Without a GPS fix, or too far away, the rider may still mark
 * Arrived by giving a reason — the order is then flagged for admin review.
 */
export function checkArrival(
  input: { position: LatLng | null; drop: LatLng; reason?: string | null },
  s: Pick<GuaranteeSettings, "geofenceM">,
): ArrivalCheck {
  const reason = input.reason?.trim() || null;
  const distanceM = input.position ? haversineM(input.position, input.drop) : null;

  if (distanceM !== null && distanceM <= s.geofenceM) {
    return { ok: true, withinGeofence: true, distanceM, flagged: false };
  }
  if (reason) return { ok: true, withinGeofence: false, distanceM, flagged: true, reason };
  return {
    ok: false,
    code: distanceM === null ? "no_gps" : "outside_geofence",
    distanceM,
    geofenceM: s.geofenceM,
  };
}
