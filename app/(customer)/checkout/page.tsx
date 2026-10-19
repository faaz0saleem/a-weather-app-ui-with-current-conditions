import type { Metadata } from "next";
import { CheckoutView } from "@/components/customer/checkout-view";
import { t } from "@/lib/i18n";
import { getViewer } from "@/lib/server/auth";
import { resolveDeliveryPoint } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t.checkout.title };

export default async function CheckoutPage() {
  const viewer = await getViewer();
  const { address, addresses } = await resolveDeliveryPoint(viewer?.id ?? null);
  return <CheckoutView signedIn={!!viewer} addresses={addresses} initialAddressId={address?.id ?? null} />;
}
