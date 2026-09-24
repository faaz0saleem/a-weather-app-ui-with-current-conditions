/**
 * Formatting. Money is integer PKR shown as "Rs 1,250" (no decimals).
 * Times are shown in Asia/Karachi.
 */
export const TIMEZONE = "Asia/Karachi";

const pkr = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });

export function formatPKR(amount: number | null | undefined): string {
  return `Rs ${pkr.format(Math.round(amount ?? 0))}`;
}

const timeFmt = new Intl.DateTimeFormat("en-PK", { timeZone: TIMEZONE, hour: "numeric", minute: "2-digit", hour12: true });
const dateFmt = new Intl.DateTimeFormat("en-PK", { timeZone: TIMEZONE, day: "numeric", month: "short" });
const dateTimeFmt = new Intl.DateTimeFormat("en-PK", {
  timeZone: TIMEZONE,
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
});

const toDate = (d: Date | string | number) => (d instanceof Date ? d : new Date(d));

/** "8:42 pm" */
export function formatTime(d: Date | string | number): string {
  return timeFmt.format(toDate(d)).replace(/\s?([AP]M)$/i, (_, m: string) => ` ${m.toLowerCase()}`);
}

/** "24 Sept" */
export function formatDate(d: Date | string | number): string {
  return dateFmt.format(toDate(d));
}

/** "24 Sept, 8:42 pm" */
export function formatDateTime(d: Date | string | number): string {
  return dateTimeFmt.format(toDate(d)).replace(/\s?([AP]M)$/i, (_, m: string) => ` ${m.toLowerCase()}`);
}

/** 754 → "12:34" ; negative → "0:00". Hours shown when ≥ 1h. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(sec).padStart(2, "0")}`;
}

/** 95 → "1m 35s", 40 → "40s" */
export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  if (m === 0) return `${sec}s`;
  if (sec === 0) return `${m}m`;
  return `${m}m ${sec}s`;
}

export function formatKm(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
}

/** Karachi hour of day (0–23). */
export function karachiHour(d: Date = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: TIMEZONE, hour: "2-digit", hour12: false }).format(d)) % 24;
}
