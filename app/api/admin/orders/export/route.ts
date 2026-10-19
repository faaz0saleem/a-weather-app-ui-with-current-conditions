import { NextResponse } from "next/server";
import { karachiStamp, toCsv } from "@/lib/csv";
import { rangeBounds, requireAdmin, type ReportRange } from "@/lib/server/admin";
import { dbError, route } from "@/lib/server/http";
import { getServiceSupabase } from "@/lib/supabase/service";

const MAX_ROWS = 5000;

const HEADER = [
  "Order", "Placed (PKT)", "Restaurant", "Customer", "Phone", "Address", "Status",
  "Guarantee", "Late by (min)", "Late cause", "Items (Rs)", "Delivery fee (Rs)", "Total (Rs)",
  "Free amount (Rs)", "To collect (Rs)", "Restaurant charge (Rs)", "Rider", "Rider payout (Rs)",
  "Arrived (PKT)", "Delivered (PKT)", "Arrival flagged", "Test order",
];

/** Orders in a range as CSV — for settling with kitchens and riders during the pilot. */
export const GET = route(async (req: Request) => {
  await requireAdmin();
  const sp = new URL(req.url).searchParams;
  const range = (["today", "7d", "30d"] as const).find((r) => r === sp.get("range")) ?? ("7d" satisfies ReportRange);
  const includeSim = sp.get("sim") === "1";
  const { from, to } = await rangeBounds(range);

  const sb = getServiceSupabase();
  let q = sb
    .from("orders")
    .select(
      "code, placed_at, customer_name, customer_phone, drop_address, status, guarantee_state, late_by_sec, late_cause, items_subtotal_pkr, delivery_fee_pkr, total_pkr, free_amount_pkr, amount_to_collect_pkr, restaurant_charge_pkr, rider_id, rider_payout_pkr, arrived_at, delivered_at, arrival_flagged, is_simulated, restaurants(name)",
    )
    .gte("placed_at", from.toISOString())
    .lt("placed_at", to.toISOString())
    .order("placed_at", { ascending: true })
    .limit(MAX_ROWS);
  if (!includeSim) q = q.eq("is_simulated", false);
  const { data: orders, error } = await q;
  if (error) throw dbError(error);

  const riderIds = [...new Set((orders ?? []).map((o) => o.rider_id).filter((id): id is string => !!id))];
  const riderNames = new Map<string, string>();
  if (riderIds.length) {
    const { data: riders } = await sb.from("riders").select("id, profiles(full_name)").in("id", riderIds);
    for (const r of riders ?? []) riderNames.set(r.id, r.profiles?.full_name ?? "");
  }

  const rows = (orders ?? []).map((o) => [
    o.code,
    karachiStamp(o.placed_at),
    o.restaurants?.name ?? "",
    o.customer_name,
    o.customer_phone ?? "",
    o.drop_address,
    o.status,
    o.guarantee_state,
    o.late_by_sec != null ? Math.round(o.late_by_sec / 6) / 10 : "",
    o.late_cause ?? "",
    o.items_subtotal_pkr,
    o.delivery_fee_pkr,
    o.total_pkr,
    o.free_amount_pkr,
    o.amount_to_collect_pkr,
    o.restaurant_charge_pkr,
    o.rider_id ? (riderNames.get(o.rider_id) ?? "") : "",
    o.rider_payout_pkr,
    karachiStamp(o.arrived_at),
    karachiStamp(o.delivered_at),
    o.arrival_flagged ? "yes" : "",
    o.is_simulated ? "yes" : "",
  ]);

  const stamp = karachiStamp(new Date().toISOString()).slice(0, 10);
  return new NextResponse(toCsv(HEADER, rows), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="waqtpe-orders-${range}-${stamp}.csv"`,
      "cache-control": "no-store",
    },
  });
});
