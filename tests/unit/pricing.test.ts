import { describe, expect, it } from "vitest";
import { lineTotal, quoteSubtotal, quoteTotal } from "@/lib/events/pricing";

describe("quote math", () => {
  it("multiplies and rounds line totals", () => {
    expect(lineTotal("30.00", "2.5")).toBe(75);
    expect(lineTotal(19.99, 3)).toBe(59.97);
  });

  it("sums packages and custom lines", () => {
    const sub = quoteSubtotal(
      [
        { unitPrice: "250.00", quantity: "1" },
        { unitPrice: "15.00", quantity: "4" },
      ],
      [{ price: "-25.00" }],
    );
    expect(sub).toBe(285);
  });

  it("adds rentals and subtracts discount like the legacy site", () => {
    expect(quoteTotal(285, "40.00", "28.50")).toBe(296.5);
  });
});
