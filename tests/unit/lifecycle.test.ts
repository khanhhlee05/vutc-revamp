import { describe, expect, it } from "vitest";
import { availableActions, nextStatus, TRANSITIONS } from "@/lib/events/lifecycle";
import { STATUS_ORDER } from "@/lib/events/status";

describe("lifecycle transitions", () => {
  it("follows the legacy happy path", () => {
    expect(nextStatus("requested", "confirm")).toBe("confirmed");
    expect(nextStatus("confirmed", "open")).toBe("open");
    expect(nextStatus("open", "complete")).toBe("completed");
    expect(nextStatus("completed", "create_payroll")).toBe("payroll_created");
    expect(nextStatus("payroll_created", "bill")).toBe("billed");
    expect(nextStatus("billed", "mark_paid")).toBe("paid");
    expect(nextStatus("paid", "archive")).toBe("archived");
  });

  it("rejects illegal moves", () => {
    expect(nextStatus("requested", "open")).toBeNull();
    expect(nextStatus("paid", "cancel")).toBeNull();
    expect(nextStatus("archived", "restore")).toBeNull();
    expect(nextStatus("completed", "mark_paid")).toBeNull();
  });

  it("allows cancel only before completion and restore only from cancelled", () => {
    expect(nextStatus("open", "cancel")).toBe("cancelled");
    expect(nextStatus("requested", "deny")).toBe("cancelled");
    expect(nextStatus("cancelled", "restore")).toBe("requested");
    expect(nextStatus("completed", "cancel")).toBeNull();
  });

  it("offers only button actions that apply to the status", () => {
    expect(availableActions("requested")).toEqual(["confirm", "deny"]);
    expect(availableActions("open")).toEqual(["close", "cancel"]);
    expect(availableActions("billed")).toEqual(["mark_paid"]);
    expect(availableActions("archived")).toEqual([]);
  });

  it("covers every status with at least one way in or out except the two terminals", () => {
    for (const status of STATUS_ORDER) {
      const inbound = Object.values(TRANSITIONS).some((t) => t.to === status);
      const outbound = Object.values(TRANSITIONS).some((t) => t.from.includes(status));
      if (status === "requested") expect(inbound || outbound).toBe(true);
      else if (status === "archived") expect(inbound).toBe(true);
      else expect(inbound && outbound).toBe(true);
    }
  });
});
