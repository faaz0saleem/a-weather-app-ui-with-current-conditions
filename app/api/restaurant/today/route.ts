import { json, route } from "@/lib/server/http";
import { kitchenToday } from "@/lib/server/kitchen";
import { kitchenContext } from "@/lib/server/kitchen-request";

export const GET = route(async (req: Request) => {
  const { restaurant } = await kitchenContext(req);
  return json({ today: await kitchenToday(restaurant.id) });
});
