import { describe, expect, it } from "vitest";
import {
  eventRequestFromFormData,
  eventRequestSchema,
  fieldErrorsFromZod,
} from "@/lib/validation/request";

function validForm(overrides: Record<string, string | string[]> = {}) {
  const base: Record<string, string | string[]> = {
    name: "Spring Formal",
    orgName: "Blue Key Society",
    contactName: "Pat Example",
    contactEmail: "pat@villanova.edu",
    contactPhone: "610-555-1234",
    advisorName: "Dr. Advisor",
    advisorEmail: "advisor@villanova.edu",
    accountIndex: "123456",
    location: "Villanova Room",
    eventDate: "2099-04-10",
    startTime: "19:00",
    endTime: "23:00",
    soundcheckTime: "",
    reservationStart: "17:00",
    reservationEnd: "23:59",
    expectedAttendance: "250",
    needs: ["Wireless Microphones", "Uplighting"],
    description: "Formal with a DJ and dancing.",
    website: "",
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries({ ...base, ...overrides })) {
    if (Array.isArray(v)) v.forEach((x) => fd.append(k, x));
    else fd.set(k, v);
  }
  return fd;
}

describe("eventRequestSchema", () => {
  it("accepts a complete request", () => {
    const r = eventRequestSchema.safeParse(eventRequestFromFormData(validForm()));
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.needs).toEqual(["Wireless Microphones", "Uplighting"]);
      expect(r.data.soundcheckTime).toBeUndefined();
    }
  });

  it("rejects a filled honeypot", () => {
    const r = eventRequestSchema.safeParse(
      eventRequestFromFormData(validForm({ website: "http://spam" })),
    );
    expect(r.success).toBe(false);
  });

  it("rejects past dates and bad reservation windows", () => {
    const r = eventRequestSchema.safeParse(
      eventRequestFromFormData(
        validForm({ eventDate: "2001-01-01", reservationStart: "20:00", reservationEnd: "21:00" }),
      ),
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      const errors = fieldErrorsFromZod(r.error);
      expect(errors.eventDate).toBeDefined();
      expect(errors.reservationStart).toBeDefined();
      expect(errors.reservationEnd).toBeDefined();
    }
  });

  it("rejects unknown checklist items and bad phones", () => {
    const r = eventRequestSchema.safeParse(
      eventRequestFromFormData(
        validForm({ needs: ["<script>"], contactPhone: "12" }),
      ),
    );
    expect(r.success).toBe(false);
    if (!r.success) {
      const errors = fieldErrorsFromZod(r.error);
      expect(errors.needs).toBeDefined();
      expect(errors.contactPhone).toBeDefined();
    }
  });
});
