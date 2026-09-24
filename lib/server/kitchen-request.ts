import "server-only";

import { requireViewer, type Viewer } from "./auth";
import { requireKitchen } from "./kitchen";
import { getServiceSupabase } from "@/lib/supabase/service";
import { notFound } from "./http";
import type { Actor } from "./rpc";

/** Auth + resolve the kitchen for a /api/restaurant/* request (admins pass ?restaurantId=). */
export async function kitchenContext(req: Request) {
  const viewer = await requireViewer(["restaurant"]);
  const restaurantId = new URL(req.url).searchParams.get("restaurantId");
  const restaurant = await requireKitchen(viewer, restaurantId);
  const actor: Actor = viewer.role === "admin" ? { id: viewer.id, role: "admin" } : { id: viewer.id, role: "restaurant" };
  return { viewer, restaurant, actor };
}

/** The order must belong to this kitchen. */
export async function kitchenOrder(restaurantId: string, orderId: string) {
  const { data } = await getServiceSupabase().from("orders").select("*").eq("id", orderId).maybeSingle();
  if (!data || data.restaurant_id !== restaurantId) throw notFound("Order not found");
  return data;
}

export type { Viewer };
