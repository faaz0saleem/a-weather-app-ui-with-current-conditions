"use client";

import { useMemo, useState } from "react";
import { Loader2, RotateCcw, Save, Trash2, Undo2 } from "lucide-react";
import { toast } from "sonner";
import { WaqtMap, type MapMarker } from "@/components/map";
import { Button } from "@/components/ui/button";
import { DEFAULT_ZONE } from "@/config/dha";
import { api } from "@/lib/client/api";
import { polygonCentroid } from "@/lib/geo";
import { AdminHeader } from "./admin-shell";

/** Delivery-zone editor: drag corners, tap the map to add one, select + delete to remove. */
export function ZoneEditor({
  initial,
  name,
  restaurants,
}: {
  initial: [number, number][];
  name: string;
  restaurants: { id: string; name: string; lat: number; lng: number; hero_emoji: string }[];
}) {
  const [points, setPoints] = useState<[number, number][]>(initial.length ? initial : DEFAULT_ZONE);
  const [history, setHistory] = useState<[number, number][][]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const commit = (next: [number, number][]) => {
    setHistory((h) => [...h.slice(-30), points]);
    setPoints(next);
  };

  const markers = useMemo<MapMarker[]>(
    () => [
      ...points.map((p, i) => ({
        id: `v${i}`,
        kind: "pin" as const,
        position: { lat: p[0], lng: p[1] },
        label: selected === i ? "✖" : String(i + 1),
        draggable: true,
        onClick: () => setSelected((cur) => (cur === i ? null : i)),
        onDragEnd: (q: { lat: number; lng: number }) => {
          setSelected(i);
          commit(points.map((x, j) => (j === i ? ([q.lat, q.lng] as [number, number]) : x)));
        },
      })),
      ...restaurants.map((r) => ({ id: `r${r.id}`, kind: "restaurant" as const, position: { lat: r.lat, lng: r.lng }, label: r.hero_emoji, title: r.name })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, selected, restaurants],
  );

  /** Insert a new corner on the edge closest to the tap. */
  function addPoint(p: { lat: number; lng: number }) {
    let best = points.length;
    let bestD = Infinity;
    for (let i = 0; i < points.length; i++) {
      const a = points[i];
      const b = points[(i + 1) % points.length];
      const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const d = (mid[0] - p.lat) ** 2 + (mid[1] - p.lng) ** 2;
      if (d < bestD) {
        bestD = d;
        best = i + 1;
      }
    }
    commit([...points.slice(0, best), [p.lat, p.lng], ...points.slice(best)]);
  }

  async function save() {
    if (points.length < 3) return toast.error("A zone needs at least 3 corners.");
    setBusy(true);
    try {
      await api("/api/admin/zone", { method: "PUT", json: { name, polygon: points.map(([a, b]) => [Number(a.toFixed(6)), Number(b.toFixed(6))]) } });
      toast.success("Delivery zone saved — eligibility uses it immediately.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const c = polygonCentroid(points);
  return (
    <div>
      <AdminHeader
        title="Delivery zone"
        subtitle="Drag the numbered corners. Tap the map to add a corner on the nearest edge. Orders outside this polygon are refused."
        right={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => history.length && (setPoints(history[history.length - 1]), setHistory(history.slice(0, -1)))} disabled={!history.length}>
              <Undo2 /> Undo
            </Button>
            <Button
              variant="outline"
              disabled={selected === null || points.length <= 3}
              onClick={() => {
                if (selected === null) return;
                commit(points.filter((_, i) => i !== selected));
                setSelected(null);
              }}
            >
              <Trash2 /> Delete corner {selected !== null ? selected + 1 : ""}
            </Button>
            <Button variant="ghost" onClick={() => commit(DEFAULT_ZONE)}>
              <RotateCcw /> Reset to default
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? <Loader2 className="animate-spin" /> : <Save />} Save zone
            </Button>
          </div>
        }
      />
      <WaqtMap
        className="h-[70vh] min-h-96 rounded-3xl shadow-soft"
        center={c}
        zoom={13}
        onClick={addPoint}
        polygons={[{ id: "zone", points: points.map(([lat, lng]) => ({ lat, lng })) }]}
        markers={markers}
      />
      <p className="mt-2 text-xs text-ink-soft">{points.length} corners · tap a corner to select it (✖), then “Delete corner”.</p>
    </div>
  );
}
