import type { LatLng, Polygon } from "@/lib/geo";
import type { RiderSnapshot } from "./riders";
import { DEFAULT_SETTINGS, type GuaranteeSettings } from "./settings";

/** Shared fixtures for guarantee tests. DHA Lahore-ish coordinates. */
export const S: GuaranteeSettings = { ...DEFAULT_SETTINGS };

export const Y_BLOCK: LatLng = { lat: 31.4757, lng: 74.3807 };

/** A point `km` north of `p` (1° lat ≈ 111.195 km). */
export const north = (p: LatLng, km: number): LatLng => ({ lat: p.lat + km / 111.19508, lng: p.lng });

export const DHA_ZONE: Polygon = [
  [31.505, 74.36],
  [31.505, 74.49],
  [31.435, 74.49],
  [31.435, 74.36],
];

/** 12:00 PKT on a fixed day = 07:00 UTC. */
export const NOON_PKT = new Date("2026-09-24T07:00:00.000Z");

export const at = (base: Date, min: number) => new Date(base.getTime() + min * 60_000);

export function idleRider(id: string, position: LatLng, seenMinAgo = 0, now = NOON_PKT): RiderSnapshot {
  return {
    id,
    status: "idle",
    isActive: true,
    position,
    lastSeenAt: at(now, -seenMinAgo),
    job: null,
  };
}

/** A point `km` east of `p`. */
export const east = (p: LatLng, km: number): LatLng => ({
  lat: p.lat,
  lng: p.lng + km / (111.19508 * Math.cos((p.lat * Math.PI) / 180)),
});
