import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ProfileView } from "@/components/customer/profile-view";
import { t } from "@/lib/i18n";
import { getViewer, homeFor } from "@/lib/server/auth";
import { resolveDeliveryPoint } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: t.profile.title };

export default async function ProfilePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/profile");
  const { addresses } = await resolveDeliveryPoint(viewer.id);
  return (
    <ProfileView
      name={viewer.fullName}
      phone={viewer.phone}
      role={viewer.role}
      roleHome={viewer.role !== "customer" ? homeFor(viewer.role) : null}
      addresses={addresses}
    />
  );
}
