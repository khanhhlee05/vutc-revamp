import { z } from "zod";
import { EVENT_NEEDS } from "@/lib/events/constants";

const trimmed = (max: number) => z.string().trim().min(1, "Required").max(max);
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use the date picker");
const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Use the time picker");
const optionalTime = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(timeString.optional());

export const phoneSchema = z
  .string()
  .trim()
  .refine((v) => {
    const digits = v.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15;
  }, "Enter a phone number with area code");

export const eventRequestSchema = z
  .object({
    name: trimmed(80),
    orgName: trimmed(80),
    contactName: trimmed(50),
    contactEmail: z.email("Enter a valid email").max(100),
    contactPhone: phoneSchema,
    advisorName: trimmed(50),
    advisorEmail: z.email("Enter a valid email").max(100),
    accountIndex: trimmed(15),
    isStudentOrg: z.boolean().default(false),
    location: trimmed(80),
    eventDate: dateString,
    startTime: timeString,
    endTime: timeString,
    soundcheckTime: optionalTime,
    reservationStart: timeString,
    reservationEnd: timeString,
    expectedAttendance: trimmed(64),
    needs: z.array(z.enum(EVENT_NEEDS)).default([]),
    description: trimmed(10000),
    /** Honeypot. Humans never fill it. */
    website: z.string().max(0, "Invalid submission").default(""),
  })
  .superRefine((v, ctx) => {
    const today = new Date().toISOString().slice(0, 10);
    if (v.eventDate < today) {
      ctx.addIssue({
        code: "custom",
        path: ["eventDate"],
        message: "Event date must be in the future",
      });
    }
    if (v.reservationStart > v.startTime) {
      ctx.addIssue({
        code: "custom",
        path: ["reservationStart"],
        message: "Reservation must start at or before the event start",
      });
    }
    if (v.reservationEnd < v.endTime) {
      ctx.addIssue({
        code: "custom",
        path: ["reservationEnd"],
        message: "Reservation must end at or after the event end",
      });
    }
  });

export type EventRequestInput = z.infer<typeof eventRequestSchema>;

/** Converts the multipart form into the shape the schema expects. */
export function eventRequestFromFormData(form: FormData): unknown {
  const str = (k: string) => String(form.get(k) ?? "");
  return {
    name: str("name"),
    orgName: str("orgName"),
    contactName: str("contactName"),
    contactEmail: str("contactEmail"),
    contactPhone: str("contactPhone"),
    advisorName: str("advisorName"),
    advisorEmail: str("advisorEmail"),
    accountIndex: str("accountIndex"),
    isStudentOrg: form.get("isStudentOrg") === "on",
    location: str("location"),
    eventDate: str("eventDate"),
    startTime: str("startTime"),
    endTime: str("endTime"),
    soundcheckTime: str("soundcheckTime"),
    reservationStart: str("reservationStart"),
    reservationEnd: str("reservationEnd"),
    expectedAttendance: str("expectedAttendance"),
    needs: form.getAll("needs").map(String),
    description: str("description"),
    website: str("website"),
  };
}

export type FieldErrors = Partial<Record<keyof EventRequestInput, string>>;

export function fieldErrorsFromZod(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !(key in out)) {
      out[key as keyof EventRequestInput] = issue.message;
    }
  }
  return out;
}
