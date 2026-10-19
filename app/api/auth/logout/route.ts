import { getServerSupabase } from "@/lib/supabase/server";
import { json, route } from "@/lib/server/http";

export const POST = route(async () => {
  const supabase = await getServerSupabase();
  await supabase.auth.signOut();
  return json({ ok: true });
});
