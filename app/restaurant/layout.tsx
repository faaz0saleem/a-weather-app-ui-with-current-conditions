import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { t } from "@/lib/i18n";
import { getViewer, homeFor } from "@/lib/server/auth";

export const metadata: Metadata = { title: t.kitchen.title };

export default async function RestaurantLayout({ children }: LayoutProps<"/restaurant">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/restaurant");
  if (viewer.role !== "restaurant" && viewer.role !== "admin") redirect(homeFor(viewer.role));
  return <div className="min-h-dvh bg-cream">{children}</div>;
}
