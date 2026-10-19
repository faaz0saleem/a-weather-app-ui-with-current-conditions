import { getLiveBoard, requireAdmin } from "@/lib/server/admin";
import { json, route } from "@/lib/server/http";

export const GET = route(async () => {
  await requireAdmin();
  return json(await getLiveBoard());
});
