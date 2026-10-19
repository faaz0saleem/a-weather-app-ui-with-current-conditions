import "server-only";

import { getServiceSupabase } from "@/lib/supabase/service";
import type { Tables } from "@/lib/supabase/database.types";
import type { Viewer } from "./auth";
import { forbidden, notFound } from "./http";

export type KitchenOrder = {
  id: string;
  code: string;
  status: string;
  placedAt: string;
  acceptBy: string;
  acceptedAt: string | null;
  committedPrepMin: number | null;
  readyBy: string | null;
  readyAt: string | null;
  pickedUpAt: string | null;
  predictedPrepMin: number;
  maxCommitMin: number;
  customerFirstName: string;
  note: string | null;
  guaranteeActive: boolean;
  sealedBagPhotoUrl: string | null;
  items: { name: string; emoji: string; qty: number; options: string[] }[];
  rider: { name: string; phone: string | null } | null;
  totalPkr: number;
};

/** Which restaurant is this viewer running? Staff → their own; admin → the one they picked. */
export async function requireKitchen(viewer: Viewer, restaurantId?: string | null): Promise<Tables<"restaurants">> {
  let id: string | null = null;
  if (viewer.role === "restaurant") id = viewer.restaurantId;
  else if (viewer.role === "admin") id = restaurantId ?? null;
  else throw forbidden();
  if (!id) throw notFound("Pick a restaurant");
  const { data } = await getServiceSupabase().from("restaurants").select("*").eq("id", id).maybeSingle();
  if (!data) throw notFound("Restaurant not found");
  return data;
}

/** D26: a kitchen can't dodge the split clock by committing an inflated prep time. */
export function maxCommitMin(predictedPrepMin: number, fastLaneMaxPrepMin: number) {
  return Math.max(predictedPrepMin, fastLaneMaxPrepMin);
}

const LIVE = ["placed", "accepted", "ready", "picked_up"] as const;

export async function listKitchenOrders(restaurantId: string, fastLaneMaxPrepMin: number): Promise<KitchenOrder[]> {
  const sb = getServiceSupabase();
  const { data } = await sb
    .from("orders")
    .select(
      "id, code, status, placed_at, accept_by, accepted_at, committed_prep_min, ready_by, ready_at, picked_up_at, predicted_prep_min, customer_name, customer_note, guarantee_active, sealed_bag_photo_url, total_pkr, rider_id, order_items(name, emoji, qty, options)",
    )
    .eq("restaurant_id", restaurantId)
    .in("status", [...LIVE])
    .order("placed_at", { ascending: true });
  const orders = data ?? [];
  const riderIds = [...new Set(orders.map((o) => o.rider_id).filter((x): x is string => !!x))];
  const { data: riders } = riderIds.length
    ? await sb.from("profiles").select("id, full_name, phone").in("id", riderIds)
    : { data: [] as { id: string; full_name: string; phone: string | null }[] };

  return orders.map((o) => {
    const rider = riders?.find((r) => r.id === o.rider_id);
    return {
      id: o.id,
      code: o.code,
      status: o.status,
      placedAt: o.placed_at,
      acceptBy: o.accept_by,
      acceptedAt: o.accepted_at,
      committedPrepMin: o.committed_prep_min,
      readyBy: o.ready_by,
      readyAt: o.ready_at,
      pickedUpAt: o.picked_up_at,
      predictedPrepMin: o.predicted_prep_min,
      maxCommitMin: maxCommitMin(o.predicted_prep_min, fastLaneMaxPrepMin),
      customerFirstName: (o.customer_name || "Customer").split(" ")[0],
      note: o.customer_note,
      guaranteeActive: o.guarantee_active,
      sealedBagPhotoUrl: o.sealed_bag_photo_url,
      totalPkr: o.total_pkr,
      items: (o.order_items ?? []).map((i) => ({
        name: i.name,
        emoji: i.emoji,
        qty: i.qty,
        options: Array.isArray(i.options) ? (i.options as { option?: string }[]).map((x) => x.option ?? "").filter(Boolean) : [],
      })),
      rider: rider ? { name: rider.full_name, phone: rider.phone } : null,
    };
  });
}

export type KitchenToday = {
  orders: number;
  completed: number;
  active: number;
  rejected: number;
  timeouts: number;
  onTimePct: number | null;
  late: number;
  kitchenLates: number;
  kitchenChargesPkr: number;
  salesPkr: number;
  avgPrepMin: number | null;
};

export async function kitchenToday(restaurantId: string): Promise<KitchenToday> {
  const { data } = await getServiceSupabase().rpc("restaurant_today", { p_restaurant_id: restaurantId });
  const d = (data ?? {}) as Record<string, number | null>;
  return {
    orders: Number(d.orders ?? 0),
    completed: Number(d.completed ?? 0),
    active: Number(d.active ?? 0),
    rejected: Number(d.rejected ?? 0),
    timeouts: Number(d.timeouts ?? 0),
    onTimePct: d.on_time_pct == null ? null : Number(d.on_time_pct),
    late: Number(d.late ?? 0),
    kitchenLates: Number(d.kitchen_lates ?? 0),
    kitchenChargesPkr: Number(d.kitchen_charges_pkr ?? 0),
    salesPkr: Number(d.sales_pkr ?? 0),
    avgPrepMin: d.avg_prep_min == null ? null : Number(d.avg_prep_min),
  };
}

/** Compress-free server upload of an image to a public bucket. Returns the public URL. */
export async function uploadImage(bucket: "bag-photos" | "menu-photos" | "avatars", path: string, file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Not an image");
  if (file.size > 6 * 1024 * 1024) throw new Error("Image too large (max 6 MB)");
  const sb = getServiceSupabase();
  const { error } = await sb.storage.from(bucket).upload(path, await file.arrayBuffer(), {
    contentType: file.type,
    upsert: true,
    cacheControl: "31536000",
  });
  if (error) throw new Error(error.message);
  return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
