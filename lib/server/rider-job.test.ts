import { describe, expect, it } from "vitest";
import { RIDER_FORBIDDEN_KEYS, toRiderJob } from "./rider-job";

// A full orders row, including every guarantee field a rider must NOT see.
const fullOrderRow = {
  id: "o1",
  code: "WP-1001",
  status: "picked_up" as const,
  drop_address: "House 142, Y Block, Phase 3",
  drop_lat: 31.479,
  drop_lng: 74.386,
  drop_gate_note: "Guard will receive",
  customer_name: "Hassan Raza",
  customer_phone: "+923000000101",
  customer_note: null,
  amount_to_collect_pkr: 0,
  total_pkr: 1330,
  rider_payout_pkr: 150,
  distance_km: "1.10",
  promised_by: "2026-09-24T08:00:00Z",
  guarantee_state: "free",
  guarantee_active: true,
  late_by_sec: 95,
  late_cause: "kitchen",
  window_min: 30,
  accept_by: "2026-09-24T07:32:00Z",
  free_amount_pkr: 1330,
  predicted_eta_min: 22,
};

describe("rider job serializer (rule 11)", () => {
  const job = toRiderJob(fullOrderRow, { name: "Tikka Taiyaar", address: "Y Block", lat: 31.47, lng: 74.38, phone: null }, [
    { name: "Chicken Tikka", qty: 2 },
  ]);
  const json = JSON.stringify(job);

  it.each(RIDER_FORBIDDEN_KEYS)("never exposes %s", (key) => {
    expect(json).not.toContain(`"${key}"`);
  });

  it("never exposes the deadline timestamp or lateness, even as a value", () => {
    expect(json).not.toContain("2026-09-24T08:00:00Z");
    expect(json).not.toContain("kitchen");
    expect(json).not.toMatch(/late|hurry|deadline|timer/i);
  });

  it("shows cash to collect neutrally (Rs 0 covered by WaqtPe)", () => {
    expect(job.collectPkr).toBe(0);
    expect(job.coveredByWaqtpe).toBe(true);
  });

  it("keeps the fixed payout and only the customer's first name", () => {
    expect(job.payoutPkr).toBe(150);
    expect(job.customer.name).toBe("Hassan");
  });
});
