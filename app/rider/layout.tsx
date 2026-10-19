import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { t } from "@/lib/i18n";
import { getViewer, homeFor } from "@/lib/server/auth";

export const metadata: Metadata = { title: t.rider.title };

export default async function RiderLayout({ children }: LayoutProps<"/rider">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/rider");
  if (viewer.role !== "rider") redirect(homeFor(viewer.role));
  return <div className="mx-auto min-h-dvh max-w-md bg-cream">{children}</div>;
}
