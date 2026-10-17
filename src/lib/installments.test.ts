import { describe, expect, it } from "vitest";
import { calculatePlan, markupFor } from "./installments";
import { normalizeNgPhone } from "./validation";

describe("calculatePlan", () => {
  it("monthly 12 months at 32% markup on N100,000", () => {
    const r = calculatePlan({ price: 100000, months: 12, frequency: "monthly" });
    expect(r.payments).toBe(12);
    expect(r.perPayment).toBe(11000);
    expect(r.total).toBe(132000);
    expect(r.extra).toBe(32000);
  });
  it("weekly uses 52 weeks per year and rounds up to nearest N50", () => {
    const r = calculatePlan({ price: 100000, months: 6, frequency: "weekly" });
    expect(r.payments).toBe(26);
    // 118000 / 26 = 4538.46 -> 4550
    expect(r.perPayment).toBe(4550);
  });
  it("deposit reduces the financed amount", () => {
    const r = calculatePlan({ price: 100000, months: 3, frequency: "monthly", deposit: 40000 });
    expect(r.financed).toBe(60000);
    expect(r.perPayment).toBe(22000);
    expect(r.total).toBe(106000);
  });
  it("custom duration uses next configured markup", () => {
    expect(markupFor(7)).toBe(25);
    expect(markupFor(36)).toBe(58);
  });
});

describe("normalizeNgPhone", () => {
  it("accepts 0 and +234 formats", () => {
    expect(normalizeNgPhone("0803 123 4567")).toBe("08031234567");
    expect(normalizeNgPhone("+2348031234567")).toBe("08031234567");
  });
  it("rejects bad numbers", () => {
    expect(normalizeNgPhone("0803123456")).toBeNull();
    expect(normalizeNgPhone("05031234567")).toBeNull();
  });
});
