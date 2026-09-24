import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AddressForm } from "@/components/customer/address-form";
import { t } from "@/lib/i18n";
import { getViewer } from "@/lib/server/auth";
import { getActiveZones } from "@/lib/server/dispatch";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t.address.newTitle };

export default async function NewAddressPage({ searchParams }: PageProps<"/addresses/new">) {
  const sp = await searchParams;
  const next = typeof sp.next === "string" && sp.next.startsWith("/") ? sp.next : "/";
  const viewer = await getViewer();
  if (!viewer) redirect(`/login?next=${encodeURIComponent(`/addresses/new?next=${next}`)}`);
  const zones = await getActiveZones();
  return <AddressForm zones={zones} next={next} />;
}
