import { describe, expect, it } from "vitest";
import { clientIp, createLimiter } from "./rate-limit";

describe("rate limiter", () => {
  it("allows up to max hits per window, then reports seconds to wait", () => {
    let t = 0;
    const l = createLimiter(() => t);
    const lim = { max: 3, windowMs: 60_000 };
    expect([l.hit("a", lim), l.hit("a", lim), l.hit("a", lim)]).toEqual([0, 0, 0]);
    expect(l.hit("a", lim)).toBe(60);
    t = 45_000;
    expect(l.hit("a", lim)).toBe(15);
  });

  it("resets after the window and keeps keys independent", () => {
    let t = 0;
    const l = createLimiter(() => t);
    const lim = { max: 1, windowMs: 10_000 };
    expect(l.hit("a", lim)).toBe(0);
    expect(l.hit("b", lim)).toBe(0);
    expect(l.hit("a", lim)).toBeGreaterThan(0);
    t = 10_000;
    expect(l.hit("a", lim)).toBe(0);
  });

  it("reads the first forwarded IP", () => {
    const req = new Request("http://x", { headers: { "x-forwarded-for": "1.2.3.4, 10.0.0.1" } });
    expect(clientIp(req)).toBe("1.2.3.4");
    expect(clientIp(new Request("http://x"))).toBe("unknown");
  });
});
