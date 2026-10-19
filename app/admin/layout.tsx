import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { t } from "@/lib/i18n";
import { getViewer, homeFor } from "@/lib/server/auth";
import { DEV_TOOLS } from "@/lib/supabase/env";

export const metadata: Metadata = { title: t.admin.title };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const viewer = await getViewer();
  if (!viewer) redirect("/login?next=/admin");
  if (viewer.role !== "admin") redirect(homeFor(viewer.role));
  return (
    <AdminShell name={viewer.fullName} devTools={DEV_TOOLS}>
      {children}
    </AdminShell>
  );
}
