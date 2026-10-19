import { describe, expect, it } from "vitest";
import { computePaySplit, defaultFractions, type SplitWorker } from "@/lib/pay/split";

const w = (id: number, role: SplitWorker["role"], run: number, load: number): SplitWorker => ({ id, role, run, load });

function total(result: ReturnType<typeof computePaySplit>) {
  let staff = 0;
  for (const v of result.pay.values()) staff += v;
  return Math.round((staff + result.vutcShare) * 100) / 100;
}

describe("computePaySplit", () => {
  it("splits a plain PA event half to VUTC and half by load", () => {
    const r = computePaySplit({
      lines: [{ amount: 250, routing: "standard" }],
      customTotal: 0,
      discount: 0,
      workers: [w(1, "event_staff", 0, 1), w(2, "event_staff", 0, 1), w(3, "senior_staff", 0, 0.5)],
    });
    expect(r.vutcShare).toBe(125);
    expect(r.pay.get(1)).toBe(50);
    expect(r.pay.get(2)).toBe(50);
    expect(r.pay.get(3)).toBe(25);
    expect(total(r)).toBe(250);
  });

  it("pays op-time packages to the matching operator in full", () => {
    const r = computePaySplit({
      lines: [
        { amount: 250, routing: "standard" },
        { amount: 60, routing: "op_audio" }, // 3h audio op
      ],
      customTotal: 0,
      discount: 0,
      workers: [w(1, "aht", 1, 1), w(2, "event_staff", 0, 1)],
    });
    expect(r.pay.get(1)).toBe(60 + 62.5);
    expect(r.pay.get(2)).toBe(62.5);
    expect(r.vutcShare).toBe(125);
    expect(total(r)).toBe(310);
  });

  it("splits a shared operator pool by run fraction", () => {
    const r = computePaySplit({
      lines: [{ amount: 100, routing: "op_light" }],
      customTotal: 0,
      discount: 0,
      workers: [w(1, "lht", 1, 0), w(2, "lht", 0.5, 0)],
    });
    expect(r.pay.get(1)).toBeCloseTo(66.67, 2);
    expect(r.pay.get(2)).toBeCloseTo(33.33, 2);
  });

  it("routes wireless mics and power to VUTC and rentals to the drivers", () => {
    const r = computePaySplit({
      lines: [
        { amount: 200, routing: "standard" },
        { amount: 45, routing: "wireless" },
        { amount: 50, routing: "power" },
        { amount: 80, routing: "rental" },
      ],
      customTotal: 0,
      discount: 0,
      workers: [w(1, "event_staff", 0, 1), w(2, "rental_pickup", 0, 0), w(3, "rental_dropoff", 0, 0)],
    });
    expect(r.pay.get(1)).toBe(100);
    expect(r.pay.get(2)).toBe(40);
    expect(r.pay.get(3)).toBe(40);
    expect(r.vutcShare).toBe(100 + 45 + 50);
    expect(total(r)).toBe(375);
  });

  it("charges the discount to VUTC only, so payouts still equal what the client pays", () => {
    const r = computePaySplit({
      lines: [{ amount: 400, routing: "standard" }],
      customTotal: 0,
      discount: 40,
      workers: [w(1, "event_staff", 0, 1)],
    });
    expect(r.pay.get(1)).toBe(200);
    expect(r.vutcShare).toBe(160);
    expect(total(r)).toBe(360);
  });

  it("lets event staff with run time draw from head tech pools", () => {
    const r = computePaySplit({
      lines: [{ amount: 90, routing: "op_audio" }],
      customTotal: 0,
      discount: 0,
      workers: [w(1, "aht", 1, 0), w(2, "event_staff", 0.5, 0)],
    });
    // staff draws 90 * (0.5 / 1) = 45 gross; VUTC keeps 22.50; AHT gets the remaining 45 pool
    expect(r.pay.get(2)).toBe(22.5);
    expect(r.pay.get(1)).toBe(45);
    expect(r.vutcShare).toBe(22.5);
    expect(total(r)).toBe(90);
  });

  it("treats custom quote lines as base revenue and sends rounding to VUTC", () => {
    const r = computePaySplit({
      lines: [],
      customTotal: 100,
      discount: 0,
      workers: [w(1, "event_staff", 0, 1), w(2, "event_staff", 0, 1), w(3, "event_staff", 0, 1)],
    });
    expect(r.pay.get(1)).toBe(16.67);
    expect(r.breakdown.roundingToVutc).toBe(-0.01);
    expect(total(r)).toBe(100);
  });

  it("warns and keeps money when a pool has nobody to pay", () => {
    const r = computePaySplit({
      lines: [{ amount: 50, routing: "op_dj" }, { amount: 30, routing: "rental" }],
      customTotal: 0,
      discount: 0,
      workers: [w(1, "event_staff", 0, 1)],
    });
    expect(r.warnings.length).toBeGreaterThanOrEqual(2);
    expect(total(r)).toBe(80);
  });
});

describe("defaultFractions", () => {
  it("matches the legacy timesheet defaults", () => {
    expect(defaultFractions("aht")).toEqual({ run: 1, load: 1, runLocked: true, loadLocked: false });
    expect(defaultFractions("dj")).toEqual({ run: 1, load: 0, runLocked: true, loadLocked: false });
    expect(defaultFractions("rental_pickup").loadLocked).toBe(true);
    expect(defaultFractions("event_staff")).toEqual({ run: 0, load: 1, runLocked: false, loadLocked: false });
  });
});
