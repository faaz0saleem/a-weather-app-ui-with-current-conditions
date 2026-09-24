import { getAnalytics, requireAdmin } from "@/lib/server/admin";
import { json, route } from "@/lib/server/http";

export const GET = route(async (req: Request) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const range = (["today", "7d", "30d"] as const).find((r) => r === sp.get("range")) ?? "7d";
  return json({ report: await getAnalytics(range, sp.get("sim") === "1") });
});
