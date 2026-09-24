import { z } from "zod";
import { json, readJson, route } from "@/lib/server/http";
import { requireRider, saveRiderLocation } from "@/lib/server/rider";

const body = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180), accuracy: z.number().min(0).nullable().optional() });

/** Saved every ~30 s while online (live 5-second updates go over Realtime broadcast). */
export const POST = route(async (req: Request) => {
  const { viewer } = await requireRider();
  const p = body.parse(await readJson(req));
  await saveRiderLocation(viewer.id, p);
  return json({ ok: true });
});
