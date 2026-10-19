import { SettingsAdmin } from "@/components/admin/settings-admin";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { data } = await getServiceSupabase().from("app_settings").select("*").eq("id", true).single();
  return <SettingsAdmin initial={data!} />;
}
