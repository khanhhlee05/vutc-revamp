"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { organizationComments, organizations } from "@/db/schema";
import { audit } from "@/lib/audit";
import { assertRole } from "@/lib/auth/session";
import { todayString } from "@/lib/time";

const orgSchema = z.object({
  name: z.string().trim().min(1, "Required").max(80),
  description: z.string().trim().max(5000).default(""),
  alertFlag: z.boolean().default(false),
});

export type OrgFormState = { errors?: Record<string, string>; saved?: boolean };

function parse(form: FormData) {
  return orgSchema.safeParse({
    name: form.get("name"),
    description: form.get("description") ?? "",
    alertFlag: form.get("alertFlag") === "on",
  });
}

export async function createOrganization(_prev: OrgFormState, form: FormData): Promise<OrgFormState> {
  const admin = await assertRole("event_mgmt");
  const parsed = parse(form);
  if (!parsed.success) return { errors: { name: parsed.error.issues[0]?.message ?? "Invalid" } };
  const [created] = await db
    .insert(organizations)
    .values({ ...parsed.data, alertDate: parsed.data.alertFlag ? todayString() : null, createdById: admin.id })
    .returning({ id: organizations.id });
  await audit({ action: "organization.created", userId: admin.id, entityType: "organization", entityId: created.id, detail: parsed.data.name });
  revalidatePath("/manage/organizations");
  redirect(`/manage/organizations/${created.id}`);
}

export async function updateOrganization(_prev: OrgFormState, form: FormData): Promise<OrgFormState> {
  const admin = await assertRole("event_mgmt");
  const id = Number(form.get("id"));
  const parsed = parse(form);
  if (!parsed.success) return { errors: { name: parsed.error.issues[0]?.message ?? "Invalid" } };
  const existing = await db.query.organizations.findFirst({ where: eq(organizations.id, id) });
  if (!existing) return { errors: { name: "Not found" } };
  await db
    .update(organizations)
    .set({
      ...parsed.data,
      alertDate: parsed.data.alertFlag ? (existing.alertFlag ? existing.alertDate : todayString()) : null,
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, id));
  await audit({ action: "organization.updated", userId: admin.id, entityType: "organization", entityId: id });
  revalidatePath("/manage/organizations");
  revalidatePath(`/manage/organizations/${id}`);
  return { saved: true };
}

export async function addOrganizationComment(form: FormData): Promise<void> {
  const admin = await assertRole("event_mgmt");
  const id = Number(form.get("id"));
  const body = String(form.get("body") ?? "").trim().slice(0, 2000);
  if (!Number.isInteger(id) || !body) redirect(`/manage/organizations/${id}`);
  await db.insert(organizationComments).values({ organizationId: id, userId: admin.id, body });
  await audit({ action: "organization.comment", userId: admin.id, entityType: "organization", entityId: id });
  revalidatePath(`/manage/organizations/${id}`);
  redirect(`/manage/organizations/${id}`);
}
