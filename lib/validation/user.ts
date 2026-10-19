import { z } from "zod";
import { userRoleEnum } from "@/db/schema";
import { phoneSchema } from "./request";

const optionalPhone = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(phoneSchema.optional());

const optionalYear = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : Number(v)))
  .pipe(z.number().int().min(2000).max(2100).optional());

export const profileSchema = z.object({
  phone: optionalPhone,
  gradYear: optionalYear,
  bannerId: z
    .string()
    .trim()
    .max(11)
    .regex(/^[0-9]*$/, "Digits only")
    .default(""),
  residence: z.string().trim().max(120).default(""),
  emergencyContact: z.string().trim().max(120).default(""),
  emergencyPhone: optionalPhone,
  receivesNotifications: z.boolean().default(false),
});

export const inviteUserSchema = profileSchema.extend({
  name: z.string().trim().min(1, "Required").max(100),
  email: z.email("Enter a valid email").max(100),
  roles: z.array(z.enum(userRoleEnum.enumValues)).default([]),
  isApproved: z.boolean().default(true),
});

export const updateUserSchema = inviteUserSchema.extend({
  isActive: z.boolean().default(true),
  notes: z.string().trim().max(2000).default(""),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;

export function profileFromForm(form: FormData) {
  const str = (k: string) => String(form.get(k) ?? "");
  return {
    phone: str("phone"),
    gradYear: str("gradYear"),
    bannerId: str("bannerId"),
    residence: str("residence"),
    emergencyContact: str("emergencyContact"),
    emergencyPhone: str("emergencyPhone"),
    receivesNotifications: form.get("receivesNotifications") === "on",
  };
}

export function userFromForm(form: FormData) {
  return {
    ...profileFromForm(form),
    name: String(form.get("name") ?? ""),
    email: String(form.get("email") ?? ""),
    roles: form.getAll("roles").map(String),
    isApproved: form.get("isApproved") === "on",
    isActive: form.get("isActive") === "on",
    notes: String(form.get("notes") ?? ""),
  };
}

export function firstErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
