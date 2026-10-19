import { describe, expect, it } from "vitest";
import { formatPkPhone, normalizePkPhone, phoneToLoginEmail } from "./auth/phone";
import { formatClock, formatDuration, formatPKR, formatTime } from "./format";
import { timerTone } from "./timer";

describe("money", () => {
  it('formats PKR as "Rs 1,250" with no decimals', () => {
    expect(formatPKR(1250)).toBe("Rs 1,250");
    expect(formatPKR(0)).toBe("Rs 0");
    expect(formatPKR(3000.6)).toBe("Rs 3,001");
    expect(formatPKR(125000)).toBe("Rs 125,000");
  });
});

describe("time", () => {
  it("shows Asia/Karachi wall time", () => {
    expect(formatTime(new Date("2026-09-24T15:42:00Z"))).toBe("8:42 pm");
  });
  it("clock + durations", () => {
    expect(formatClock(754)).toBe("12:34");
    expect(formatClock(-5)).toBe("0:00");
    expect(formatClock(3725)).toBe("1:02:05");
    expect(formatDuration(95)).toBe("1m 35s");
    expect(formatDuration(40)).toBe("40s");
  });
});

describe("race-screen colours", () => {
  it("mint → amber (≤10 min) → chili (≤3 min) → gold (free)", () => {
    expect(timerTone(25 * 60, "active")).toBe("mint");
    expect(timerTone(10 * 60, "active")).toBe("amber");
    expect(timerTone(3 * 60, "active")).toBe("chili");
    expect(timerTone(0, "active")).toBe("gold");
    expect(timerTone(12 * 60, "free")).toBe("gold");
    expect(timerTone(null, "off")).toBe("muted");
  });
});

describe("Pakistani phone numbers", () => {
  it("normalises the usual ways people type them", () => {
    for (const raw of ["0300 1234567", "03001234567", "+92 300 1234567", "923001234567", "0092-300-1234567", "300-1234567"]) {
      expect(normalizePkPhone(raw)).toBe("+923001234567");
    }
  });
  it("rejects landlines and junk", () => {
    expect(normalizePkPhone("042 35761234")).toBeNull();
    expect(normalizePkPhone("12345")).toBeNull();
    expect(normalizePkPhone("")).toBeNull();
  });
  it("formats and maps to the internal login email", () => {
    expect(formatPkPhone("+923001234567")).toBe("0300 1234567");
    expect(phoneToLoginEmail("+923001234567", "phone.waqtpe.app")).toBe("923001234567@phone.waqtpe.app");
  });
});
