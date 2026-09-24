/**
 * Plain geometry helpers. Client-safe (the rider app uses them for display),
 * and the guarantee engine builds on them.
 */
export type LatLng = { lat: number; lng: number };

/** Polygon as [[lat, lng], ...] — the shape stored in `zones.polygon`. */
export type Polygon = [number, number][];

const EARTH_RADIUS_KM = 6371.0088;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle ("straight-line") distance in km. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function haversineM(a: LatLng, b: LatLng): number {
  return haversineKm(a, b) * 1000;
}

/**
 * Ray-casting point-in-polygon. Fine for city-sized polygons (no antimeridian
 * or pole issues in Lahore). Points exactly on an edge may go either way.
 */
export function pointInPolygon(p: LatLng, polygon: Polygon): boolean {
  if (polygon.length < 3) return false;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [yi, xi] = polygon[i];
    const [yj, xj] = polygon[j];
    const intersects =
      yi > p.lat !== yj > p.lat && p.lng < ((xj - xi) * (p.lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/** Move `from` towards `to` by `km` (straight line). Used by the simulator. */
export function stepTowards(from: LatLng, to: LatLng, km: number): { point: LatLng; arrived: boolean } {
  const total = haversineKm(from, to);
  if (total <= km || total === 0) return { point: { ...to }, arrived: true };
  const f = km / total;
  return {
    point: { lat: from.lat + (to.lat - from.lat) * f, lng: from.lng + (to.lng - from.lng) * f },
    arrived: false,
  };
}

export function polygonCentroid(polygon: Polygon): LatLng {
  const n = polygon.length || 1;
  const sum = polygon.reduce((acc, [lat, lng]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }), {
    lat: 0,
    lng: 0,
  });
  return { lat: sum.lat / n, lng: sum.lng / n };
}
