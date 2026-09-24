"use client";

import { useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getBrowserSupabase } from "@/lib/supabase/browser";
import { keepAwake } from "./alarm";
import { api } from "./api";
import { FLEET_CHANNEL, riderChannel } from "./realtime";

export type GpsFix = { lat: number; lng: number; accuracy: number; at: number };
export type GpsStatus = "idle" | "locating" | "ok" | "denied" | "unavailable" | "insecure";

/**
 * While online: watch GPS (high accuracy), broadcast the position over
 * Supabase Realtime every `broadcastSec` (customers + ops see it live), save
 * it to the DB every `saveSec`, and keep the screen awake.
 */
export function useRiderLocation(opts: { riderId: string; online: boolean; broadcastSec: number; saveSec: number }) {
  const { riderId, online, broadcastSec, saveSec } = opts;
  const [fix, setFix] = useState<GpsFix | null>(null);
  const [status, setStatus] = useState<GpsStatus>("idle");
  const latest = useRef<GpsFix | null>(null);

  useEffect(() => {
    if (!online) return;
    if (typeof window !== "undefined" && !window.isSecureContext) {
      queueMicrotask(() => setStatus("insecure"));
      return;
    }
    if (!("geolocation" in navigator)) {
      queueMicrotask(() => setStatus("unavailable"));
      return;
    }
    queueMicrotask(() => setStatus("locating"));
    const watch = navigator.geolocation.watchPosition(
      (p) => {
        const f = { lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, at: Date.now() };
        latest.current = f;
        setFix(f);
        setStatus("ok");
      },
      (err) => setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 20000 },
    );

    const sb = getBrowserSupabase();
    const channels: RealtimeChannel[] = [sb.channel(riderChannel(riderId)).subscribe(), sb.channel(FLEET_CHANNEL).subscribe()];

    const broadcast = window.setInterval(() => {
      const f = latest.current;
      if (!f) return;
      const payload = { riderId, lat: f.lat, lng: f.lng, accuracy: f.accuracy };
      channels.forEach((c) => void c.send({ type: "broadcast", event: "pos", payload }));
    }, broadcastSec * 1000);

    const save = window.setInterval(() => {
      const f = latest.current;
      if (f) void api("/api/rider/location", { json: { lat: f.lat, lng: f.lng, accuracy: f.accuracy } }).catch(() => {});
    }, saveSec * 1000);

    void keepAwake(true);
    const onVis = () => document.visibilityState === "visible" && void keepAwake(true);
    document.addEventListener("visibilitychange", onVis);

    return () => {
      navigator.geolocation.clearWatch(watch);
      window.clearInterval(broadcast);
      window.clearInterval(save);
      channels.forEach((c) => void sb.removeChannel(c));
      document.removeEventListener("visibilitychange", onVis);
      void keepAwake(false);
    };
  }, [online, riderId, broadcastSec, saveSec]);

  return { fix: online ? fix : null, status: online ? status : "idle", latest };
}

/** One-off position (e.g. when tapping Arrived). Resolves null on failure — never throws. */
export function currentPosition(timeoutMs = 8000): Promise<GpsFix | null> {
  return new Promise((resolve) => {
    if (!("geolocation" in navigator)) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude, accuracy: p.coords.accuracy, at: Date.now() }),
      () => resolve(null),
      { enableHighAccuracy: true, timeout: timeoutMs, maximumAge: 5000 },
    );
  });
}
