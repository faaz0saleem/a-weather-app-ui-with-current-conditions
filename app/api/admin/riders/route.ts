import { getServiceSupabase } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/server/admin";
import { riderCreateSchema } from "@/lib/server/admin-manage";
import { dbError, json, readJson, route } from "@/lib/server/http";
import { createStaffAccount } from "@/lib/server/phone-auth";

export const GET = route(async () => {
  await requireAdmin();
  const { data } = await getServiceSupabase()
    .from("riders")
    .select("*, profiles(full_name, phone)")
    .order("created_at");
  return json({ riders: data ?? [] });
});

/** Create a rider login (phone + temporary password). */
export const POST = route(async (req: Request) => {
  await requireAdmin();
  const input = riderCreateSchema.parse(await readJson(req));
  const acct = await createStaffAccount(input);
  const sb = getServiceSupabase();
  await sb.from("profiles").update({ role: "rider", full_name: input.fullName, phone: acct.phone }).eq("id", acct.id);
  const { error } = await sb.from("riders").insert({ id: acct.id, vehicle: input.vehicle, plate: input.plate ?? null });
  if (error) throw dbError(error);
  return json({ ok: true, id: acct.id });
});
