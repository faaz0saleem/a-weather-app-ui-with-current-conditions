import { getServiceSupabase } from "@/lib/supabase/service";
import { requireDevTools } from "@/lib/server/dev";
import { json, route } from "@/lib/server/http";
import { RIDERS } from "@/supabase/seed/data";

/** Puts every idle/offline test rider online at their seeded spot with a fresh GPS fix. */
export const POST = route(async () => {
  requireDevTools();
  const sb = getServiceSupabase();
  const { data: profiles } = await sb.from("profiles").select("id, phone").eq("role", "rider").eq("is_test", true);
  let count = 0;
  for (const p of profiles ?? []) {
    const seed = RIDERS.find((r) => r.phone === p.phone);
    const { data: rider } = await sb.from("riders").select("status, last_lat, last_lng").eq("id", p.id).single();
    if (!rider) continue;
    await sb
      .from("riders")
      .update({
        status: rider.status === "busy" ? "busy" : "idle",
        last_lat: rider.last_lat ?? seed?.start[0] ?? null,
        last_lng: rider.last_lng ?? seed?.start[1] ?? null,
        last_seen_at: new Date().toISOString(),
      })
      .eq("id", p.id);
    count++;
  }
  return json({ ok: true, count });
});
