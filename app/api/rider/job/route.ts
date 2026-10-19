import { json, route } from "@/lib/server/http";
import { getRiderState, requireRider } from "@/lib/server/rider";

/** Rider home state: status, current job (sanitised — no deadline, rule 11), today's earnings. */
export const GET = route(async () => {
  const { viewer } = await requireRider();
  return json(await getRiderState(viewer.id));
});
