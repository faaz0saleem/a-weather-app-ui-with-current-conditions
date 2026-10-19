import "server-only";

import { ApiError } from "./http";

/**
 * Small in-memory fixed-window rate limiter. Enough for the pilot: the app runs
 * as a single Node process on Hostinger (see ecosystem.config.cjs). If it ever
 * runs on several instances, move this to a shared store.
 */
type Window = { start: number; count: number };

export type Limit = { max: number; windowMs: number };

export const LIMITS = {
  login: { max: 10, windowMs: 60_000 },
  loginPerPhone: { max: 8, windowMs: 10 * 60_000 },
  signup: { max: 5, windowMs: 10 * 60_000 },
  placeOrder: { max: 6, windowMs: 60_000 },
} satisfies Record<string, Limit>;

const MAX_KEYS = 10_000;

export function createLimiter(now: () => number = Date.now) {
  const windows = new Map<string, Window>();

  /** Returns seconds until the caller may retry, or 0 when the hit is allowed. */
  function hit(key: string, { max, windowMs }: Limit): number {
    const t = now();
    let w = windows.get(key);
    if (!w || t - w.start >= windowMs) {
      if (windows.size >= MAX_KEYS) prune(t, windowMs);
      w = { start: t, count: 0 };
      windows.set(key, w);
    }
    w.count += 1;
    if (w.count <= max) return 0;
    return Math.max(1, Math.ceil((w.start + windowMs - t) / 1000));
  }

  function prune(t: number, windowMs: number) {
    for (const [k, w] of windows) if (t - w.start >= windowMs) windows.delete(k);
    // Still full (a burst of distinct keys): drop the oldest entries.
    if (windows.size >= MAX_KEYS) {
      const drop = windows.size - MAX_KEYS + 1;
      let i = 0;
      for (const k of windows.keys()) {
        if (i++ >= drop) break;
        windows.delete(k);
      }
    }
  }

  return { hit, size: () => windows.size };
}

const limiter = createLimiter();

/** Best-effort client IP behind Hostinger's / Nginx's proxy. */
export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/** Throw a 429 when `key` has used up its `limit`. */
export function enforceLimit(bucket: string, key: string, limit: Limit) {
  const retryAfter = limiter.hit(`${bucket}:${key}`, limit);
  if (retryAfter > 0) {
    throw new ApiError(429, "rate_limited", `Too many attempts. Please try again in ${retryAfter} s.`, {
      retryAfterSec: retryAfter,
    });
  }
}
