import { getServiceSupabase } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/server/admin";
import { restaurantSchema, staffSchema } from "@/lib/server/admin-manage";
import { dbError, json, readJson, route } from "@/lib/server/http";
import { createStaffAccount } from "@/lib/server/phone-auth";

export const GET = route(async () => {
  await requireAdmin();
  const sb = getServiceSupabase();
  const [{ data: restaurants }, { data: staff }] = await Promise.all([
    sb.from("restaurants").select("*").order("sort"),
    sb.from("profiles").select("id, full_name, phone, restaurant_id").eq("role", "restaurant"),
  ]);
  return json({ restaurants: restaurants ?? [], staff: staff ?? [] });
});

/** Create a restaurant (+ optional kitchen login). */
export const POST = route(async (req: Request) => {
  await requireAdmin();
  const raw = (await readJson(req)) as Record<string, unknown>;
  const input = restaurantSchema.parse(raw);
  const sb = getServiceSupabase();
  const { data, error } = await sb.from("restaurants").insert(input).select("*").single();
  if (error) throw dbError(error);
  if (raw.staff) {
    const staff = staffSchema.parse(raw.staff);
    const acct = await createStaffAccount(staff);
    await sb.from("profiles").update({ role: "restaurant", restaurant_id: data.id, full_name: staff.fullName, phone: acct.phone }).eq("id", acct.id);
  }
  return json({ restaurant: data });
});
