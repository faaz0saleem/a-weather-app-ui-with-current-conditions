import { z } from "zod";
import { requireAdmin } from "@/lib/server/admin";
import { evaluateOrder } from "@/lib/server/engine";
import { json, readJson, route } from "@/lib/server/http";
import { transitionOrThrow } from "@/lib/server/rpc";

const body = z.object({ reason: z.string().trim().min(2).max(200) });

export const POST = route(async (req: Request, ctx: RouteContext<"/api/admin/orders/[id]/cancel">) => {
  const { actor } = await requireAdmin();
  const { id } = await ctx.params;
  const { reason } = body.parse(await readJson(req));
  await transitionOrThrow(id, "cancelled", actor, { reason });
  await evaluateOrder(id);
  return json({ ok: true });
});
