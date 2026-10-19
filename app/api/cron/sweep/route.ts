import { runBackgroundTick } from "@/lib/server/background";
import { ApiError, json, route } from "@/lib/server/http";

/**
 * Backup trigger for the guarantee sweep (e.g. a Hostinger cron job:
 *   curl -s "https://app.example.com/api/cron/sweep?key=YOUR_CRON_SECRET"
 * The in-process sweep (instrumentation.ts) normally makes this unnecessary.
 */
export const GET = route(async (req: Request) => {
  const key = new URL(req.url).searchParams.get("key") ?? req.headers.get("x-cron-key");
  if (!process.env.CRON_SECRET || key !== process.env.CRON_SECRET) throw new ApiError(401, "unauthorized", "Bad key");
  await runBackgroundTick();
  return json({ ok: true });
});
