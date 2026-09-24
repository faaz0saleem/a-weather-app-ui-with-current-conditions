import { cookies } from "next/headers";
import { getServiceSupabase } from "@/lib/supabase/service";
import { addressSchema } from "@/lib/server/addresses";
import { requireViewer } from "@/lib/server/auth";
import { dbError, json, readJson, route } from "@/lib/server/http";

export const POST = route(async (req: Request) => {
  const viewer = await requireViewer();
  const input = addressSchema.parse(await readJson(req));
  const sb = getServiceSupabase();
  const { count } = await sb.from("addresses").select("id", { count: "exact", head: true }).eq("user_id", viewer.id);
  const makeDefault = input.is_default || !count;
  if (makeDefault) await sb.from("addresses").update({ is_default: false }).eq("user_id", viewer.id);
  const { data, error } = await sb
    .from("addresses")
    .insert({ ...input, street: input.street || null, gate_note: input.gate_note || null, user_id: viewer.id, is_default: makeDefault })
    .select("*")
    .single();
  if (error) throw dbError(error);
  (await cookies()).set("wp_addr", data.id, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  return json({ address: data });
});
