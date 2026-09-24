import { z } from "zod";
import { getServiceSupabase } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/server/admin";
import { dbError, json, readJson, route } from "@/lib/server/http";

const body = z.object({
  name: z.string().trim().min(1).max(60).default("DHA Lahore"),
  polygon: z.array(z.tuple([z.number().min(-90).max(90), z.number().min(-180).max(180)])).min(3).max(200),
});

export const GET = route(async () => {
  await requireAdmin();
  const { data } = await getServiceSupabase().from("zones").select("*").order("created_at");
  return json({ zones: data ?? [] });
});

/** Replace the active delivery zone polygon. */
export const PUT = route(async (req: Request) => {
  await requireAdmin();
  const { name, polygon } = body.parse(await readJson(req));
  const sb = getServiceSupabase();
  const { data: existing } = await sb.from("zones").select("id").eq("is_active", true).order("created_at").limit(1).maybeSingle();
  const res = existing
    ? await sb.from("zones").update({ name, polygon }).eq("id", existing.id).select("*").single()
    : await sb.from("zones").insert({ name, polygon, is_active: true }).select("*").single();
  if (res.error) throw dbError(res.error);
  return json({ zone: res.data });
});
