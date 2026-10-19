"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/browser";

export type RiderPosition = { lat: number; lng: number; accuracy?: number | null; at: number };

/** Channel names for rider GPS broadcasts (D14). */
export const riderChannel = (riderId: string) => `rider:${riderId}`;
export const FLEET_CHANNEL = "fleet";

/**
 * Call `onChange` whenever rows matching `filter` change (RLS applies, so users
 * only hear about rows they can read). Debounced so bursts cause one refetch.
 */
export function useTableChanges(
  table: "orders" | "riders" | "app_settings" | "restaurants" | "menu_items",
  filter: string | null,
  onChange: (payload: unknown) => void,
  enabled = true,
) {
  const cb = useRef(onChange);
  useEffect(() => {
    cb.current = onChange;
  });
  useEffect(() => {
    if (!enabled) return;
    const sb = getBrowserSupabase();
    let timer: number | null = null;
    const channel = sb
      .channel(`db:${table}:${filter ?? "all"}:${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, ...(filter ? { filter } : {}) },
        (payload) => {
          if (timer) window.clearTimeout(timer);
          timer = window.setTimeout(() => cb.current(payload), 150);
        },
      )
      .subscribe();
    return () => {
      if (timer) window.clearTimeout(timer);
      void sb.removeChannel(channel);
    };
  }, [table, filter, enabled]);
}

/** Live rider position: 5-second broadcasts, falling back to DB saves (~30 s). */
export function useRiderPosition(riderId: string | null, initial: { lat: number | null; lng: number | null } | null) {
  const [pos, setPos] = useState<RiderPosition | null>(null);

  useEffect(() => {
    if (!riderId) return;
    const sb = getBrowserSupabase();
    const channels: RealtimeChannel[] = [];
    channels.push(
      sb
        .channel(riderChannel(riderId))
        .on("broadcast", { event: "pos" }, ({ payload }) => {
          const p = payload as { lat: number; lng: number; accuracy?: number };
          if (typeof p?.lat === "number" && typeof p?.lng === "number") setPos({ lat: p.lat, lng: p.lng, accuracy: p.accuracy, at: Date.now() });
        })
        .subscribe(),
    );
    channels.push(
      sb
        .channel(`db:rider:${riderId}:${Math.random().toString(36).slice(2, 8)}`)
        .on("postgres_changes", { event: "UPDATE", schema: "public", table: "riders", filter: `id=eq.${riderId}` }, (payload) => {
          const r = payload.new as { last_lat: number | null; last_lng: number | null };
          if (r.last_lat != null && r.last_lng != null) setPos({ lat: r.last_lat, lng: r.last_lng, at: Date.now() });
        })
        .subscribe(),
    );
    return () => channels.forEach((c) => void sb.removeChannel(c));
  }, [riderId]);

  if (pos) return pos;
  return initial?.lat != null && initial?.lng != null ? { lat: initial.lat, lng: initial.lng, at: 0 } : null;
}
