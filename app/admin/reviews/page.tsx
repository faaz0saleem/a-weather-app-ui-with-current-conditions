import { ReviewsAdmin } from "@/components/admin/reviews-admin";
import { getServiceSupabase } from "@/lib/supabase/service";

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const { data } = await getServiceSupabase()
    .from("orders")
    .select("id, code, arrived_at, arrival_reason, arrival_distance_m, arrival_accuracy_m, arrival_lat, arrival_lng, drop_lat, drop_lng, drop_address, guarantee_state, arrival_reviewed_at, arrival_review_note, restaurants(name), rider_id")
    .eq("arrival_flagged", true)
    .order("arrived_at", { ascending: false })
    .limit(100);
  const riderIds = [...new Set((data ?? []).map((o) => o.rider_id).filter((x): x is string => !!x))];
  const { data: riders } = riderIds.length
    ? await getServiceSupabase().from("profiles").select("id, full_name").in("id", riderIds)
    : { data: [] as { id: string; full_name: string }[] };
  const rows = (data ?? []).map((o) => ({ ...o, riderName: riders?.find((r) => r.id === o.rider_id)?.full_name ?? "—" }));
  return <ReviewsAdmin rows={rows} />;
}
