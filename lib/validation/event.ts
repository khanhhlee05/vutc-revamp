import { z } from "zod";
import { EVENT_NEEDS } from "@/lib/events/constants";
import { phoneSchema } from "./request";

const text = (max: number) => z.string().trim().max(max).default("");
const required = (max: number) => z.string().trim().min(1, "Required").max(max);
const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Use HH:MM");
/** Treats an empty form field as "not provided", then validates with `inner`. */
const optional = <T extends z.ZodTypeAny>(inner: T) =>
  z.preprocess(
    (v) => (typeof v === "string" ? (v.trim() === "" ? undefined : v.trim()) : v),
    inner.optional(),
  );
const slot = z.coerce.number().int().min(0).max(50).default(0);
const money = z.coerce.number().min(0).max(1_000_000).default(0);

export const eventEditSchema = z
  .object({
    name: required(80),
    orgName: required(80),
    organizationId: optional(z.coerce.number().int().positive()),
    contactName: required(50),
    contactEmail: z.email("Enter a valid email").max(100),
    contactPhone: phoneSchema,
    advisorName: text(50),
    advisorEmail: optional(z.email("Enter a valid email").max(100)),
    accountIndex: text(15),
    isStudentOrg: z.boolean().default(false),
    location: required(80),
    eventDate: dateString,
    startTime: timeString,
    endTime: timeString,
    soundcheckTime: optional(timeString),
    loadInDate: optional(dateString),
    loadInTime: optional(timeString),
    reservationStart: optional(timeString),
    reservationEnd: optional(timeString),
    expectedAttendance: text(64),
    needs: z.array(z.enum(EVENT_NEEDS)).default([]),
    description: text(10000),
    notes: text(5000),
    htNotes: text(5000),
    planningNotes: text(1000),
    quoteSentNote: text(500),
    crewSlots: slot,
    seniorStaffSlots: slot,
    ahtSlots: slot,
    lhtSlots: slot,
    vhtSlots: slot,
    djSlots: slot,
    spotSlots: slot,
    cameraSlots: slot,
    runnerSlots: slot,
    discount: money,
    rentalPrice: money,
    rentalDescription: text(2000),
    openOn: optional(dateString),
    autoOpen: z.boolean().default(false),
    notifyStaff: z.boolean().default(true),
  })
  .superRefine((v, ctx) => {
    if (v.loadInTime && !v.loadInDate) {
      ctx.addIssue({ code: "custom", path: ["loadInDate"], message: "Set the load-in date too" });
    }
    if (v.autoOpen && !v.openOn) {
      ctx.addIssue({ code: "custom", path: ["openOn"], message: "Auto-open needs a date" });
    }
  });

export type EventEditInput = z.infer<typeof eventEditSchema>;

export function eventEditFromForm(form: FormData): unknown {
  const str = (k: string) => String(form.get(k) ?? "");
  const on = (k: string) => form.get(k) === "on";
  const keys = [
    "name", "orgName", "organizationId", "contactName", "contactEmail", "contactPhone",
    "advisorName", "advisorEmail", "accountIndex", "location", "eventDate", "startTime",
    "endTime", "soundcheckTime", "loadInDate", "loadInTime", "reservationStart",
    "reservationEnd", "expectedAttendance", "description", "notes", "htNotes",
    "planningNotes", "quoteSentNote", "crewSlots", "seniorStaffSlots", "ahtSlots",
    "lhtSlots", "vhtSlots", "djSlots", "spotSlots", "cameraSlots", "runnerSlots",
    "discount", "rentalPrice", "rentalDescription", "openOn",
  ];
  const out: Record<string, unknown> = {};
  for (const k of keys) out[k] = str(k);
  out.needs = form.getAll("needs").map(String);
  out.isStudentOrg = on("isStudentOrg");
  out.autoOpen = on("autoOpen");
  out.notifyStaff = on("notifyStaff");
  return out;
}

export const lineItemSchema = z.object({
  packageId: z.coerce.number().int().positive(),
  quantity: z.coerce.number().min(0.5).max(500).default(1),
  description: text(500),
});

export const customItemSchema = z.object({
  name: required(75),
  description: text(1000),
  price: z.coerce.number().min(-100_000).max(100_000),
});
