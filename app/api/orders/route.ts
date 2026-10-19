import { requireViewer } from "@/lib/server/auth";
import { json, readJson, route } from "@/lib/server/http";
import { placeOrder, placeOrderSchema } from "@/lib/server/orders";
import { LIMITS, enforceLimit } from "@/lib/server/rate-limit";

/** Place order — the clock starts here (in the database). */
export const POST = route(async (req: Request) => {
  const viewer = await requireViewer(["customer"]);
  enforceLimit("place-order", viewer.id, LIMITS.placeOrder);
  const input = placeOrderSchema.parse(await readJson(req));
  const order = await placeOrder(viewer, input);
  return json({ id: order.id, code: order.code });
});
