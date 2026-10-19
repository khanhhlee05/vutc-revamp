import { describe, expect, it } from "vitest";
import { hasAnyRole, hasRole } from "@/lib/auth/roles";

describe("hasRole", () => {
  it("grants a directly held role", () => {
    expect(hasRole(["event_mgmt"], "event_mgmt")).toBe(true);
  });

  it("denies a role that is not held", () => {
    expect(hasRole(["senior"], "event_mgmt")).toBe(false);
    expect(hasRole([], "aht")).toBe(false);
  });

  it("treats exec as a superset of every role", () => {
    expect(hasRole(["exec"], "bus_mgmt")).toBe(true);
    expect(hasRole(["exec"], "aht")).toBe(true);
  });

  it("lets officers act in their management area", () => {
    expect(hasRole(["vpep"], "event_mgmt")).toBe(true);
    expect(hasRole(["vpf"], "bus_mgmt")).toBe(true);
    expect(hasRole(["vpep"], "bus_mgmt")).toBe(false);
    expect(hasRole(["vpf"], "pers_mgmt")).toBe(false);
  });
});

describe("hasAnyRole", () => {
  it("passes when at least one required role is satisfied", () => {
    expect(hasAnyRole(["lht"], ["aht", "lht"])).toBe(true);
    expect(hasAnyRole(["dj"], ["aht", "lht"])).toBe(false);
  });
});
