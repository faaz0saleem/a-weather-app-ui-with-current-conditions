"use client";

import { useEffect, useSyncExternalStore } from "react";

/**
 * Rule 4 — never trust the device clock. We sample /api/time (DB app time,
 * including the dev time warp), keep the offset against performance.now()
 * (monotonic, immune to the user changing their phone's clock), and advance
 * at the warp rate.
 */
type Sample = { serverAt: number; perfAt: number; warp: number; rtt: number };

let sample: Sample | null = null;
let syncing: Promise<void> | null = null;
let lastSync = 0;
const listeners = new Set<() => void>();
let ticker: number | null = null;
let tick = 0;

async function sampleOnce(): Promise<Sample | null> {
  const t0 = performance.now();
  try {
    const res = await fetch("/api/time", { cache: "no-store" });
    const t1 = performance.now();
    if (!res.ok) return null;
    const { now, warp } = (await res.json()) as { now: number; warp: number };
    const rtt = t1 - t0;
    return { serverAt: now + (rtt / 2) * warp, perfAt: t1, warp, rtt };
  } catch {
    return null;
  }
}

export function syncServerClock(force = false): Promise<void> {
  if (syncing) return syncing;
  if (!force && sample && performance.now() - lastSync < 20_000) return Promise.resolve();
  syncing = (async () => {
    const samples: Sample[] = [];
    for (let i = 0; i < 3; i++) {
      const s = await sampleOnce();
      if (s) samples.push(s);
    }
    if (samples.length) {
      sample = samples.sort((a, b) => a.rtt - b.rtt)[0];
      lastSync = performance.now();
      listeners.forEach((l) => l());
    }
  })().finally(() => {
    syncing = null;
  });
  return syncing;
}

/** Current server (app) time in ms. Falls back to Date.now() only until the first sync lands. */
export function serverNow(): number {
  if (!sample) return Date.now();
  return sample.serverAt + (performance.now() - sample.perfAt) * sample.warp;
}

export function isClockSynced(): boolean {
  return sample !== null;
}

export function warpFactor(): number {
  return sample?.warp ?? 1;
}

function subscribe(l: () => void) {
  listeners.add(l);
  if (ticker === null) {
    ticker = window.setInterval(() => {
      tick++;
      listeners.forEach((fn) => fn());
    }, 250);
  }
  return () => {
    listeners.delete(l);
    if (listeners.size === 0 && ticker !== null) {
      window.clearInterval(ticker);
      ticker = null;
    }
  };
}

const noopSubscribe = () => () => {};

/** Prime the clock with a server-rendered DB time until the first real sync lands. */
function seed(nowMs: number) {
  if (sample || !nowMs || typeof performance === "undefined") return;
  sample = { serverAt: nowMs, perfAt: performance.now(), warp: 1, rtt: Number.POSITIVE_INFINITY };
}

/**
 * Re-renders ~4×/s with the server-synced time. `seedNow` is the DB time the
 * server rendered with — used for the hydration render so SSR and the first
 * client render agree exactly.
 */
export function useServerNow(seedNow: number): number {
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  useEffect(() => {
    void syncServerClock();
    const resync = () => {
      if (document.visibilityState === "visible") void syncServerClock(true);
    };
    const id = window.setInterval(() => void syncServerClock(true), 60_000);
    document.addEventListener("visibilitychange", resync);
    window.addEventListener("online", resync);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", resync);
      window.removeEventListener("online", resync);
    };
  }, []);
  // The tick counter makes the snapshot change on every interval.
  useSyncExternalStore(subscribe, () => tick, () => 0);
  if (!hydrated) return seedNow;
  seed(seedNow);
  return serverNow();
}
