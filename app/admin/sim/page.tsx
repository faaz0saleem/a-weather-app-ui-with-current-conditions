import { notFound } from "next/navigation";
import { SimAdmin } from "@/components/admin/sim-admin";
import { DEV_TOOLS } from "@/lib/supabase/env";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function SimPage() {
  if (!DEV_TOOLS) notFound();
  const { data } = await getServiceSupabase().from("restaurants").select("id, name").eq("is_active", true).order("sort");
  return <SimAdmin restaurants={data ?? []} />;
}
