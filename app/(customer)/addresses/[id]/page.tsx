import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AddressForm } from "@/components/customer/address-form";
import { t } from "@/lib/i18n";
import { getViewer } from "@/lib/server/auth";
import { getActiveZones } from "@/lib/server/dispatch";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t.address.title };

export default async function EditAddressPage({ params }: PageProps<"/addresses/[id]">) {
  const { id } = await params;
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/profile");
  const { data } = await getServiceSupabase().from("addresses").select("*").eq("id", id).maybeSingle();
  if (!data || data.user_id !== viewer.id) notFound();
  const zones = await getActiveZones();
  return <AddressForm zones={zones} next="/profile" initial={data} />;
}
