import { getViewer } from "@/lib/server/auth";
import { json, readJson, route } from "@/lib/server/http";
import { quoteCheckout, quoteInputSchema } from "@/lib/server/orders";

/** Checkout preview: server-priced cart + guarantee status, before the customer commits. */
export const POST = route(async (req: Request) => {
  const input = quoteInputSchema.parse(await readJson(req));
  const viewer = await getViewer();
  return json(await quoteCheckout(viewer, input));
});
