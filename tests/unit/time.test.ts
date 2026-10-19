import { describe, expect, it } from "vitest";
import { addDays, toZonedDateString, zonedToUtc } from "@/lib/time";

describe("zonedToUtc", () => {
  it("converts an EST wall clock time to UTC", () => {
    // January: New York is UTC-5
    expect(zonedToUtc("2026-01-15", "19:00").toISOString()).toBe(
      "2026-01-16T00:00:00.000Z",
    );
  });

  it("converts an EDT wall clock time to UTC", () => {
    // July: New York is UTC-4
    expect(zonedToUtc("2026-07-04", "21:30").toISOString()).toBe(
      "2026-07-05T01:30:00.000Z",
    );
  });

  it("round trips the calendar date", () => {
    const d = zonedToUtc("2026-03-08", "23:45");
    expect(toZonedDateString(d)).toBe("2026-03-08");
  });
});

describe("addDays", () => {
  it("crosses month boundaries", () => {
    expect(addDays("2026-01-31", 1)).toBe("2026-02-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
});
