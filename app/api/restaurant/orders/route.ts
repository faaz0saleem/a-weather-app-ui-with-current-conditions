import { getSettings } from "@/lib/server/dispatch";
import { json, route } from "@/lib/server/http";
import { listKitchenOrders } from "@/lib/server/kitchen";
import { kitchenContext } from "@/lib/server/kitchen-request";
import { sweep } from "@/lib/server/engine";

export const GET = route(async (req: Request) => {
  const { restaurant } = await kitchenContext(req);
  void sweep();
  const s = await getSettings();
  const orders = await listKitchenOrders(restaurant.id, s.fastLaneMaxPrepMin);
  return json({ orders, restaurant: { id: restaurant.id, name: restaurant.name, pausedUntil: restaurant.paused_until, isAccepting: restaurant.is_accepting } });
});
