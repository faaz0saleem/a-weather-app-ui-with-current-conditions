import "server-only";

import { getServiceSupabase } from "@/lib/supabase/service";

const ACTIVE = ["placed", "accepted", "ready", "picked_up", "arrived"] as const;

export type ActiveOrderSummary = {
  id: string;
  code: string;
  status: (typeof ACTIVE)[number];
  restaurantName: string;
  restaurantEmoji: string;
  promisedBy: string | null;
  guaranteeState: string;
};

export async function getActiveOrdersForCustomer(customerId: string): Promise<ActiveOrderSummary[]> {
  const { data } = await getServiceSupabase()
    .from("orders")
    .select("id, code, status, promised_by, guarantee_state, restaurants(name, hero_emoji)")
    .eq("customer_id", customerId)
    .in("status", [...ACTIVE])
    .order("placed_at", { ascending: false })
    .limit(3);
  return (data ?? []).map((o) => ({
    id: o.id,
    code: o.code,
    status: o.status as ActiveOrderSummary["status"],
    restaurantName: o.restaurants?.name ?? "",
    restaurantEmoji: o.restaurants?.hero_emoji ?? "🍽️",
    promisedBy: o.promised_by,
    guaranteeState: o.guarantee_state,
  }));
}

export type CustomerOrderView = {
  id: string;
  code: string;
  status: string;
  guaranteeActive: boolean;
  guaranteeState: string;
  windowMin: number;
  placedAt: string;
  acceptBy: string;
  promisedBy: string | null;
  acceptedAt: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  arrivedAt: string | null;
  deliveredAt: string | null;
  cancelledAt: string | null;
  rejectedAt: string | null;
  rejectReason: string | null;
  cancelReason: string | null;
  cancelledBy: string | null;
  predictedEtaMin: number;
  subtotalPkr: number;
  deliveryFeePkr: number;
  totalPkr: number;
  freeAmountPkr: number;
  amountToCollectPkr: number;
  freeCapPkr: number;
  lateBySec: number | null;
  sealedBagPhotoUrl: string | null;
  drop: { lat: number; lng: number; address: string; gateNote: string | null };
  customerNote: string | null;
  restaurant: { id: string; name: string; slug: string; emoji: string; from: string; to: string; lat: number; lng: number; phone: string | null };
  rider: { id: string; name: string; phone: string | null; avatarUrl: string | null; vehicle: string; plate: string | null; lat: number | null; lng: number | null } | null;
  items: { name: string; emoji: string; qty: number; lineTotalPkr: number; options: string[] }[];
};

/** Full order for its customer (or an admin). Evaluates the clock first so the view is never stale. */
export async function getCustomerOrder(viewer: { id: string; role: string }, orderId: string): Promise<CustomerOrderView | null> {
  const { evaluateOrder } = await import("./engine");
  await evaluateOrder(orderId);
  const sb = getServiceSupabase();
  const { data: o } = await sb
    .from("orders")
    .select("*, restaurants(id, name, slug, hero_emoji, hero_from, hero_to, lat, lng, phone), order_items(name, emoji, qty, line_total_pkr, options)")
    .eq("id", orderId)
    .maybeSingle();
  if (!o || (o.customer_id !== viewer.id && viewer.role !== "admin")) return null;

  let rider: CustomerOrderView["rider"] = null;
  if (o.rider_id) {
    const [{ data: p }, { data: r }] = await Promise.all([
      sb.from("profiles").select("full_name, phone, avatar_url").eq("id", o.rider_id).single(),
      sb.from("riders").select("vehicle, plate, last_lat, last_lng").eq("id", o.rider_id).single(),
    ]);
    rider = {
      id: o.rider_id,
      name: p?.full_name ?? "",
      phone: p?.phone ?? null,
      avatarUrl: p?.avatar_url ?? null,
      vehicle: r?.vehicle ?? "Bike",
      plate: r?.plate ?? null,
      lat: r?.last_lat ?? null,
      lng: r?.last_lng ?? null,
    };
  }
  const rest = o.restaurants!;
  return {
    id: o.id,
    code: o.code,
    status: o.status,
    guaranteeActive: o.guarantee_active,
    guaranteeState: o.guarantee_state,
    windowMin: o.window_min,
    placedAt: o.placed_at,
    acceptBy: o.accept_by,
    promisedBy: o.promised_by,
    acceptedAt: o.accepted_at,
    readyAt: o.ready_at,
    pickedUpAt: o.picked_up_at,
    arrivedAt: o.arrived_at,
    deliveredAt: o.delivered_at,
    cancelledAt: o.cancelled_at,
    rejectedAt: o.rejected_at,
    rejectReason: o.reject_reason,
    cancelReason: o.cancel_reason,
    cancelledBy: o.cancelled_by,
    predictedEtaMin: o.predicted_eta_min,
    subtotalPkr: o.items_subtotal_pkr,
    deliveryFeePkr: o.delivery_fee_pkr,
    totalPkr: o.total_pkr,
    freeAmountPkr: o.free_amount_pkr,
    amountToCollectPkr: o.amount_to_collect_pkr,
    freeCapPkr: o.free_cap_pkr,
    lateBySec: o.late_by_sec,
    sealedBagPhotoUrl: o.sealed_bag_photo_url,
    drop: { lat: o.drop_lat, lng: o.drop_lng, address: o.drop_address, gateNote: o.drop_gate_note },
    customerNote: o.customer_note,
    restaurant: {
      id: rest.id,
      name: rest.name,
      slug: rest.slug,
      emoji: rest.hero_emoji,
      from: rest.hero_from,
      to: rest.hero_to,
      lat: rest.lat,
      lng: rest.lng,
      phone: rest.phone,
    },
    rider,
    items: (o.order_items ?? []).map((i) => ({
      name: i.name,
      emoji: i.emoji,
      qty: i.qty,
      lineTotalPkr: i.line_total_pkr,
      options: Array.isArray(i.options) ? (i.options as { option?: string }[]).map((x) => x.option ?? "").filter(Boolean) : [],
    })),
  };
}

export type OrderHistoryRow = {
  id: string;
  code: string;
  status: string;
  placedAt: string;
  totalPkr: number;
  freeAmountPkr: number;
  guaranteeState: string;
  restaurant: { id: string; name: string; slug: string; emoji: string; from: string; to: string };
  items: { itemId: string | null; name: string; emoji: string; qty: number; options: unknown; unitPricePkr: number; prepMin: number }[];
  arrivedInSec: number | null;
};

export async function listCustomerOrders(customerId: string): Promise<{ orders: OrderHistoryRow[]; savedPkr: number; freeCount: number }> {
  const { data } = await getServiceSupabase()
    .from("orders")
    .select("id, code, status, placed_at, arrived_at, total_pkr, free_amount_pkr, guarantee_state, restaurants(id, name, slug, hero_emoji, hero_from, hero_to), order_items(menu_item_id, name, emoji, qty, options, unit_price_pkr, prep_min)")
    .eq("customer_id", customerId)
    .order("placed_at", { ascending: false })
    .limit(50);
  const orders = (data ?? []).map((o) => ({
    id: o.id,
    code: o.code,
    status: o.status,
    placedAt: o.placed_at,
    totalPkr: o.total_pkr,
    freeAmountPkr: o.free_amount_pkr,
    guaranteeState: o.guarantee_state,
    restaurant: {
      id: o.restaurants!.id,
      name: o.restaurants!.name,
      slug: o.restaurants!.slug,
      emoji: o.restaurants!.hero_emoji,
      from: o.restaurants!.hero_from,
      to: o.restaurants!.hero_to,
    },
    items: (o.order_items ?? []).map((i) => ({
      itemId: i.menu_item_id,
      name: i.name,
      emoji: i.emoji,
      qty: i.qty,
      options: i.options,
      unitPricePkr: i.unit_price_pkr,
      prepMin: i.prep_min,
    })),
    arrivedInSec: o.arrived_at ? Math.round((new Date(o.arrived_at).getTime() - new Date(o.placed_at).getTime()) / 1000) : null,
  }));
  const free = orders.filter((o) => o.guaranteeState === "free");
  return { orders, savedPkr: free.reduce((s, o) => s + o.freeAmountPkr, 0), freeCount: free.length };
}
