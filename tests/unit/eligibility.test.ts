import { describe, expect, it } from "vitest";
import {
  canDrop,
  evaluateSignup,
  openEventStaffSlots,
  type SignupEvent,
  type SignupHistory,
  type SignupViewer,
} from "@/lib/events/eligibility";

const now = new Date("2026-03-10T15:00:00Z"); // 11:00 AM New York (EDT)
const hours = (h: number) => new Date(now.getTime() + h * 3_600_000);

const viewer: SignupViewer = { userId: "u1", roles: [], isActive: true, isApproved: true };

function event(overrides: Partial<SignupEvent> = {}): SignupEvent {
  return {
    id: 1,
    status: "open",
    preOpen: false,
    isEmergency: false,
    openedAt: hours(-10),
    eventDate: "2026-03-14",
    loadInAt: hours(96),
    startAt: hours(99),
    crewSlots: 6,
    seniorStaffSlots: 1,
    ahtSlots: 1,
    lhtSlots: 1,
    vhtSlots: 0,
    djSlots: 0,
    spotSlots: 0,
    cameraSlots: 0,
    runnerSlots: 0,
    taken: {},
    ...overrides,
  };
}

function history(overrides: Partial<SignupHistory> = {}): SignupHistory {
  return {
    rolesOnEvent: [],
    lastEventStaffSignupAt: null,
    lastSeniorSignupAt: null,
    onOtherOpenEventAsStaff: false,
    onOtherOpenEventAsSenior: false,
    hasSameDayEvent: false,
    ...overrides,
  };
}

function decision(role: string, input: Parameters<typeof evaluateSignup>[0]) {
  return evaluateSignup(input).find((d) => d.role === role)!;
}

describe("event staff slots", () => {
  it("subtracts reserved op positions and existing staff", () => {
    // crew 6, reserved: 1 senior + 1 aht + 1 lht = 3, taken 2 staff -> 1 open
    expect(openEventStaffSlots(event({ taken: { event_staff: 2 } }))).toBe(1);
  });
});

describe("event staff signup", () => {
  it("allows an approved, active member on an open event", () => {
    const d = decision("event_staff", { viewer, event: event(), history: history(), now });
    expect(d.state).toBe("can");
  });

  it("blocks unapproved or inactive accounts", () => {
    expect(
      decision("event_staff", { viewer: { ...viewer, isApproved: false }, event: event(), history: history(), now }).state,
    ).toBe("cannot");
    expect(
      decision("event_staff", { viewer: { ...viewer, isActive: false }, event: event(), history: history(), now }).state,
    ).toBe("cannot");
  });

  it("enforces the 3 hour cooldown and reports when to come back", () => {
    const d = decision("event_staff", {
      viewer,
      event: event(),
      history: history({ lastEventStaffSignupAt: hours(-1) }),
      now,
    });
    expect(d.state).toBe("cannot");
    expect(d.label).toMatch(/Sign up at 1:00 PM/);
    const later = decision("event_staff", {
      viewer,
      event: event(),
      history: history({ lastEventStaffSignupAt: hours(-3.1) }),
      now,
    });
    expect(later.state).toBe("can");
  });

  it("ignores the cooldown for emergency events", () => {
    const d = decision("event_staff", {
      viewer,
      event: event({ isEmergency: true }),
      history: history({ lastEventStaffSignupAt: hours(-1) }),
      now,
    });
    expect(d.state).toBe("can");
  });

  it("refuses when full, same day, closed, or pre-open", () => {
    expect(decision("event_staff", { viewer, event: event({ taken: { event_staff: 3 } }), history: history(), now }).label).toBe("No spots left");
    expect(decision("event_staff", { viewer, event: event(), history: history({ hasSameDayEvent: true }), now }).state).toBe("cannot");
    expect(decision("event_staff", { viewer, event: event({ loadInAt: hours(-1) }), history: history(), now }).label).toBe("Signup closed");
    expect(decision("event_staff", { viewer, event: event({ status: "confirmed", preOpen: true }), history: history(), now }).label).toMatch(/head tech and senior/);
  });

  it("hides everything on events that are not open or pre-open", () => {
    const all = evaluateSignup({ viewer, event: event({ status: "confirmed" }), history: history(), now });
    expect(all.every((d) => d.state === "hidden")).toBe(true);
  });

  it("reports an existing signup and hides other roles", () => {
    const all = evaluateSignup({ viewer, event: event(), history: history({ rolesOnEvent: ["event_staff"] }), now });
    expect(all.find((d) => d.role === "event_staff")?.state).toBe("signed");
    expect(all.find((d) => d.role === "aht")?.state).toBe("hidden");
  });
});

describe("head tech and senior signup", () => {
  it("shows HT roles only to members holding them, with open slots", () => {
    expect(decision("aht", { viewer, event: event(), history: history(), now }).state).toBe("hidden");
    expect(decision("aht", { viewer: { ...viewer, roles: ["aht"] }, event: event(), history: history(), now }).state).toBe("can");
    expect(decision("aht", { viewer: { ...viewer, roles: ["aht"] }, event: event({ taken: { aht: 1 } }), history: history(), now }).state).toBe("hidden");
    expect(decision("lht", { viewer: { ...viewer, roles: ["exec"] }, event: event(), history: history(), now }).state).toBe("can");
  });

  it("allows HT signup during pre-open", () => {
    const d = decision("aht", {
      viewer: { ...viewer, roles: ["aht"] },
      event: event({ status: "confirmed", preOpen: true }),
      history: history(),
      now,
    });
    expect(d.state).toBe("can");
  });

  it("makes senior staff wait when already senior on another open event", () => {
    const senior = { ...viewer, roles: ["senior" as const] };
    expect(decision("senior_staff", { viewer: senior, event: event(), history: history(), now }).state).toBe("can");
    const busy = decision("senior_staff", {
      viewer: senior,
      event: event({ openedAt: hours(-1) }),
      history: history({ onOtherOpenEventAsSenior: true, lastSeniorSignupAt: hours(-2) }),
      now,
    });
    expect(busy.state).toBe("cannot");
    expect(busy.label).toMatch(/Sign up at/);
    const free = decision("senior_staff", {
      viewer: senior,
      event: event({ openedAt: hours(-4) }),
      history: history({ onOtherOpenEventAsSenior: true, lastSeniorSignupAt: hours(-4) }),
      now,
    });
    expect(free.state).toBe("can");
  });

  it("applies senior rules to spot, camera, and runner", () => {
    const senior = { ...viewer, roles: ["senior" as const] };
    const e = event({ spotSlots: 1, cameraSlots: 1, runnerSlots: 1 });
    for (const role of ["spot", "camera", "runner"]) {
      expect(decision(role, { viewer: senior, event: e, history: history(), now }).state).toBe("can");
      expect(decision(role, { viewer, event: e, history: history(), now }).state).toBe("hidden");
    }
  });
});

describe("canDrop", () => {
  it("locks drops within 24 hours of load-in", () => {
    expect(canDrop(event({ loadInAt: hours(30) }), now)).toBe(true);
    expect(canDrop(event({ loadInAt: hours(20) }), now)).toBe(false);
    expect(canDrop(event({ status: "completed" }), now)).toBe(false);
  });
});
