import { ZoneEditor } from "@/components/admin/zone-editor";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function ZonePage() {
  const sb = getServiceSupabase();
  const [{ data: zone }, { data: restaurants }] = await Promise.all([
    sb.from("zones").select("*").eq("is_active", true).order("created_at").limit(1).maybeSingle(),
    sb.from("restaurants").select("id, name, lat, lng, hero_emoji").eq("is_active", true),
  ]);
  return <ZoneEditor initial={(zone?.polygon as [number, number][]) ?? []} name={zone?.name ?? "DHA Lahore"} restaurants={restaurants ?? []} />;
}
