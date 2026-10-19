/**
 * Opening hours in Asia/Karachi. Pakistan has had no DST since 2009, so local
 * time is a fixed UTC+05:00 — which keeps these functions pure and exact.
 */
export const KARACHI_OFFSET_MIN = 5 * 60;

const DAY_MIN = 24 * 60;

/** Minutes since local midnight in Karachi for a given instant. */
export function karachiMinuteOfDay(now: Date): number {
  const utcMin = now.getUTCHours() * 60 + now.getUTCMinutes() + now.getUTCSeconds() / 60;
  return (utcMin + KARACHI_OFFSET_MIN) % DAY_MIN;
}

/** "11:00" or "11:00:00" → 660. */
export function parseTimeOfDay(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return ((h % 24) * 60 + (m || 0)) % DAY_MIN;
}

/**
 * Open if now ∈ [opens, closes). Handles windows that cross midnight
 * (e.g. 11:00 → 02:00). opens === closes means open 24 hours.
 */
export function isOpenAt(opensAt: string, closesAt: string, now: Date): boolean {
  const open = parseTimeOfDay(opensAt);
  const close = parseTimeOfDay(closesAt);
  if (open === close) return true;
  const t = karachiMinuteOfDay(now);
  return open < close ? t >= open && t < close : t >= open || t < close;
}

/** Whole minutes until the kitchen opens (0 if open now). */
export function minutesUntilOpen(opensAt: string, closesAt: string, now: Date): number {
  if (isOpenAt(opensAt, closesAt, now)) return 0;
  const open = parseTimeOfDay(opensAt);
  const t = karachiMinuteOfDay(now);
  return Math.ceil((open - t + DAY_MIN) % DAY_MIN);
}
