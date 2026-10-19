"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/db";
import { boardPositions, notifications } from "@/db/schema";
import { audit } from "@/lib/audit";
import { assertRole } from "@/lib/auth/session";

const notificationSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).default(""),
  audience: z.enum(["staff", "client"]).default("staff"),
  priority: z.coerce.number().int().min(0).max(100).default(0),
  includeInDigest: z.boolean().default(true),
});

export async function saveNotification(form: FormData): Promise<void> {
  const admin = await assertRole("pers_mgmt", "event_mgmt");
  const parsed = notificationSchema.safeParse({
    title: form.get("title"),
    body: form.get("body") ?? "",
    audience: form.get("audience") ?? "staff",
    priority: form.get("priority") || "0",
    includeInDigest: form.get("includeInDigest") === "on",
  });
  if (!parsed.success) redirect("/manage/notifications?msg=invalid");
  await db.insert(notifications).values({ ...parsed.data, createdById: admin.id });
  await audit({ action: "notification.created", userId: admin.id, detail: parsed.data.title });
  revalidatePath("/manage/notifications");
  revalidatePath("/dashboard");
  redirect("/manage/notifications");
}

export async function toggleNotification(form: FormData): Promise<void> {
  const admin = await assertRole("pers_mgmt", "event_mgmt");
  const id = Number(form.get("id"));
  const n = await db.query.notifications.findFirst({ where: eq(notifications.id, id) });
  if (n) {
    await db.update(notifications).set({ isVisible: !n.isVisible }).where(eq(notifications.id, id));
    await audit({ action: "notification.toggled", userId: admin.id, entityType: "notification", entityId: id });
  }
  revalidatePath("/manage/notifications");
  revalidatePath("/dashboard");
  redirect("/manage/notifications");
}

export async function deleteNotification(form: FormData): Promise<void> {
  const admin = await assertRole("pers_mgmt", "event_mgmt");
  const id = Number(form.get("id"));
  await db.delete(notifications).where(eq(notifications.id, id));
  await audit({ action: "notification.deleted", userId: admin.id, entityType: "notification", entityId: id });
  revalidatePath("/manage/notifications");
  revalidatePath("/dashboard");
  redirect("/manage/notifications");
}

const boardSchema = z.object({
  title: z.string().trim().min(1).max(80),
  contactAbout: z.string().trim().max(300).default(""),
  userId: z
    .string()
    .trim()
    .transform((v) => (v === "" ? null : v)),
  displayName: z.string().trim().max(80).default(""),
  displayEmail: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .pipe(z.email().optional()),
  sortOrder: z.coerce.number().int().min(0).max(1000).default(0),
  isVisible: z.boolean().default(true),
});

export async function saveBoardPosition(form: FormData): Promise<void> {
  const admin = await assertRole("pers_mgmt");
  const id = Number(form.get("id") || 0);
  const parsed = boardSchema.safeParse({
    title: form.get("title"),
    contactAbout: form.get("contactAbout") ?? "",
    userId: form.get("userId") ?? "",
    displayName: form.get("displayName") ?? "",
    displayEmail: form.get("displayEmail") ?? "",
    sortOrder: form.get("sortOrder") || "0",
    isVisible: form.get("isVisible") === "on",
  });
  if (!parsed.success) redirect("/manage/board?msg=invalid");
  const values = {
    title: parsed.data.title,
    contactAbout: parsed.data.contactAbout,
    userId: parsed.data.userId,
    displayName: parsed.data.displayName || null,
    displayEmail: parsed.data.displayEmail ?? null,
    sortOrder: parsed.data.sortOrder,
    isVisible: parsed.data.isVisible,
  };
  if (id > 0) await db.update(boardPositions).set(values).where(eq(boardPositions.id, id));
  else await db.insert(boardPositions).values(values);
  await audit({ action: id ? "board.updated" : "board.created", userId: admin.id, detail: parsed.data.title });
  revalidatePath("/manage/board");
  revalidatePath("/about");
  redirect("/manage/board");
}

export async function deleteBoardPosition(form: FormData): Promise<void> {
  const admin = await assertRole("pers_mgmt");
  const id = Number(form.get("id"));
  await db.delete(boardPositions).where(eq(boardPositions.id, id));
  await audit({ action: "board.deleted", userId: admin.id, entityId: id });
  revalidatePath("/manage/board");
  revalidatePath("/about");
  redirect("/manage/board");
}
