"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, MapPinOff } from "lucide-react";
import { toast } from "sonner";
import { WaqtMap } from "@/components/map";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client/api";
import { formatDateTime } from "@/lib/format";
import { AdminHeader } from "./admin-shell";

type Row = {
  id: string;
  code: string;
  arrived_at: string | null;
  arrival_reason: string | null;
  arrival_distance_m: number | null;
  arrival_accuracy_m: number | null;
  arrival_lat: number | null;
  arrival_lng: number | null;
  drop_lat: number;
  drop_lng: number;
  drop_address: string;
  guarantee_state: string;
  arrival_reviewed_at: string | null;
  arrival_review_note: string | null;
  restaurants: { name: string } | null;
  riderName: string;
};

/** Rule 2: arrivals marked outside the geofence (or without GPS) land here for a human look. */
export function ReviewsAdmin({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const open = rows.filter((r) => !r.arrival_reviewed_at);
  const done = rows.filter((r) => r.arrival_reviewed_at);

  async function review(id: string) {
    try {
      await api(`/api/admin/orders/${id}/review`, { json: { note: notes[id] ?? "" } });
      toast.success("Marked as reviewed");
      router.refresh();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <AdminHeader title="GPS reviews" subtitle="Riders who tapped Arrived outside the 75 m geofence (or without GPS) had to give a reason. Check them here." />
      {open.length === 0 && (
        <p className="mb-6 flex items-center gap-2 rounded-3xl bg-card p-6 text-ink-soft shadow-soft">
          <CheckCircle2 className="text-mint-deep" /> Nothing waiting for review.
        </p>
      )}
      <ul className="grid gap-4 lg:grid-cols-2">
        {open.map((r) => (
          <li key={r.id} className="overflow-hidden rounded-3xl bg-card shadow-soft">
            <WaqtMap
              className="h-44"
              center={{ lat: r.drop_lat, lng: r.drop_lng }}
              markers={[
                { id: "drop", kind: "drop", position: { lat: r.drop_lat, lng: r.drop_lng }, label: "🏠" },
                ...(r.arrival_lat != null && r.arrival_lng != null ? [{ id: "tap", kind: "rider" as const, position: { lat: r.arrival_lat, lng: r.arrival_lng }, label: "🛵", tone: "warn" as const }] : []),
              ]}
              fitTo={[{ lat: r.drop_lat, lng: r.drop_lng }, ...(r.arrival_lat != null && r.arrival_lng != null ? [{ lat: r.arrival_lat, lng: r.arrival_lng }] : [])]}
            />
            <div className="p-4">
              <p className="flex items-center gap-2 font-bold">
                <MapPinOff className="size-4 text-chili-deep" /> {r.code} · {r.restaurants?.name}
                <Badge variant={r.guarantee_state === "free" ? "gold" : "mint"}>{r.guarantee_state}</Badge>
              </p>
              <p className="text-sm text-ink-soft">
                {r.riderName} · {r.arrived_at ? formatDateTime(r.arrived_at) : ""} ·{" "}
                {r.arrival_distance_m != null ? `${Math.round(r.arrival_distance_m)} m from pin` : "no GPS"}
                {r.arrival_accuracy_m != null ? ` (±${Math.round(r.arrival_accuracy_m)} m)` : ""}
              </p>
              <p className="mt-2 rounded-xl bg-amber/15 px-3 py-2 text-sm font-semibold">“{r.arrival_reason}”</p>
              <div className="mt-3 flex gap-2">
                <Input placeholder="Note (optional)" value={notes[r.id] ?? ""} onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })} />
                <Button onClick={() => review(r.id)}>Reviewed</Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {done.length > 0 && (
        <>
          <h2 className="mt-8 mb-2 font-display text-lg font-bold">Reviewed</h2>
          <ul className="divide-y divide-line rounded-3xl bg-card shadow-soft">
            {done.map((r) => (
              <li key={r.id} className="flex justify-between gap-3 px-5 py-3 text-sm">
                <span className="font-semibold">{r.code}</span>
                <span className="truncate text-ink-soft">“{r.arrival_reason}” → {r.arrival_review_note}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
