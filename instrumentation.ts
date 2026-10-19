/**
 * Runs once when the Node server starts (next start / next dev).
 * Hostinger runs a long-lived Node process, so the guarantee sweep can tick
 * every few seconds right here — no external cron needed. (A backup HTTP
 * trigger exists at /api/cron/sweep for a Hostinger cron job.)
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.DISABLE_SWEEP === "true") return;
  const g = globalThis as unknown as { __waqtpeSweep?: NodeJS.Timeout };
  if (g.__waqtpeSweep) return;

  const every = Math.max(2000, Number(process.env.SWEEP_INTERVAL_MS) || 5000);
  const { runBackgroundTick } = await import("./lib/server/background");
  g.__waqtpeSweep = setInterval(() => {
    void runBackgroundTick().catch((e) => console.warn("[sweep]", e instanceof Error ? e.message : e));
  }, every);
  console.log(`[waqtpe] guarantee sweep every ${every} ms`);
}
