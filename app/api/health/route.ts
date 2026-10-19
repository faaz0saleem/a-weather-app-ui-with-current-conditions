import { getServiceSupabase } from "@/lib/supabase/service";
import { json } from "@/lib/server/http";

const startedAt = Date.now();

/**
 * Uptime check for Hostinger / UptimeRobot etc. 200 when the server is up and can
 * reach Supabase, 503 otherwise. Reveals no data.
 */
export async function GET() {
  const t0 = Date.now();
  let db = false;
  try {
    const { error } = await getServiceSupabase().rpc("server_clock");
    db = !error;
  } catch {
    db = false;
  }
  return json(
    { ok: db, db, dbMs: Date.now() - t0, uptimeSec: Math.round((Date.now() - startedAt) / 1000) },
    { status: db ? 200 : 503 },
  );
}
