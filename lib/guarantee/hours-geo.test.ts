import { describe, expect, it } from "vitest";
import { haversineKm, haversineM, pointInPolygon, stepTowards } from "@/lib/geo";
import { isOpenAt, karachiMinuteOfDay, minutesUntilOpen, parseTimeOfDay } from "./hours";
import { DHA_ZONE, NOON_PKT, Y_BLOCK, north } from "./test-fixtures";

describe("Karachi time", () => {
  it("is UTC+5 with no DST", () => {
    expect(karachiMinuteOfDay(new Date("2026-01-01T00:00:00Z"))).toBe(300);
    expect(karachiMinuteOfDay(new Date("2026-07-01T19:30:00Z"))).toBe(30); // 00:30 next day
    expect(karachiMinuteOfDay(NOON_PKT)).toBe(720);
  });

  it("parses HH:MM and HH:MM:SS", () => {
    expect(parseTimeOfDay("11:00")).toBe(660);
    expect(parseTimeOfDay("02:30:00")).toBe(150);
    expect(parseTimeOfDay("24:00")).toBe(0);
  });
});

describe("opening hours", () => {
  const pkt = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return new Date(Date.UTC(2026, 8, 24, h - 5, m));
  };

  it("same-day window", () => {
    expect(isOpenAt("09:00", "17:00", pkt("08:59"))).toBe(false);
    expect(isOpenAt("09:00", "17:00", pkt("09:00"))).toBe(true);
    expect(isOpenAt("09:00", "17:00", pkt("16:59"))).toBe(true);
    expect(isOpenAt("09:00", "17:00", pkt("17:00"))).toBe(false);
  });

  it("window across midnight", () => {
    expect(isOpenAt("11:00", "02:00", pkt("23:30"))).toBe(true);
    expect(isOpenAt("11:00", "02:00", pkt("01:59"))).toBe(true);
    expect(isOpenAt("11:00", "02:00", pkt("02:00"))).toBe(false);
    expect(isOpenAt("11:00", "02:00", pkt("10:00"))).toBe(false);
  });

  it("equal open/close means 24 hours", () => {
    expect(isOpenAt("00:00", "00:00", pkt("04:00"))).toBe(true);
  });

  it("minutes until open", () => {
    expect(minutesUntilOpen("11:00", "02:00", pkt("10:15"))).toBe(45);
    expect(minutesUntilOpen("07:00", "12:00", pkt("13:00"))).toBe(18 * 60);
    expect(minutesUntilOpen("11:00", "02:00", pkt("12:00"))).toBe(0);
  });
});

describe("geo", () => {
  it("haversine: one degree of latitude ≈ 111.19 km", () => {
    expect(haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 })).toBeCloseTo(111.195, 2);
  });

  it("north() fixture moves the right distance", () => {
    expect(haversineKm(Y_BLOCK, north(Y_BLOCK, 2))).toBeCloseTo(2, 3);
    expect(haversineM(Y_BLOCK, north(Y_BLOCK, 0.075))).toBeCloseTo(75, 1);
  });

  it("point in polygon", () => {
    expect(pointInPolygon(Y_BLOCK, DHA_ZONE)).toBe(true);
    expect(pointInPolygon({ lat: 31.52, lng: 74.35 }, DHA_ZONE)).toBe(false); // Gulberg-ish
    expect(pointInPolygon(Y_BLOCK, [[1, 1], [2, 2]])).toBe(false);
  });

  it("stepTowards moves and arrives", () => {
    const to = north(Y_BLOCK, 1);
    const half = stepTowards(Y_BLOCK, to, 0.5);
    expect(half.arrived).toBe(false);
    expect(haversineKm(half.point, to)).toBeCloseTo(0.5, 3);
    expect(stepTowards(Y_BLOCK, to, 2).arrived).toBe(true);
  });
});
