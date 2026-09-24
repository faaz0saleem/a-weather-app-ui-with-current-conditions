import { getServiceSupabase } from "@/lib/supabase/service";
import { requireDevTools } from "@/lib/server/dev";
import { json, route } from "@/lib/server/http";

export const GET = route(async () => {
  requireDevTools();
  const { data } = await getServiceSupabase()
    .from("profiles")
    .select("id, role, full_name, phone, restaurant_id")
    .eq("is_test", true)
    .order("phone");
  return json({ accounts: data ?? [] });
});
