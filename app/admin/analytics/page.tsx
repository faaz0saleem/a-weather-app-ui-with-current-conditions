import { AnalyticsView } from "@/components/admin/analytics-view";
import { getAnalytics } from "@/lib/server/admin";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const report = await getAnalytics("7d", false);
  return <AnalyticsView initial={report} />;
}
