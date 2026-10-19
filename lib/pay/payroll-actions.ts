"use server";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eventAssignments, events, payrolls } from "@/db/schema";
import { audit } from "@/lib/audit";
import { assertRole } from "@/lib/auth/session";

/** Batches every completed event without a payroll into a new payroll. */
export async function createPayroll(): Promise<void> {
  const admin = await assertRole("bus_mgmt");
  const candidates = await db
    .select({ id: events.id, price: events.price, vutcShare: events.vutcShare, rentalPrice: events.rentalPrice })
    .from(events)
    .where(and(eq(events.status, "completed"), isNull(events.payrollId)));
  if (candidates.length === 0) redirect("/manage/payroll?msg=empty");
  const ids = candidates.map((c) => c.id);

  const payrollId = await db.transaction(async (tx) => {
    const [created] = await tx.insert(payrolls).values({ createdById: admin.id }).returning({ id: payrolls.id });
    await tx
      .update(events)
      .set({ payrollId: created.id, status: "payroll_created", billedAt: sql`coalesce(${events.billedAt}, now())`, updatedAt: new Date() })
      .where(inArray(events.id, ids));
    await tx.update(eventAssignments).set({ payrollId: created.id }).where(inArray(eventAssignments.eventId, ids));
    const [sums] = await tx
      .select({ payout: sql<string>`coalesce(sum(${eventAssignments.pay}), 0)` })
      .from(eventAssignments)
      .where(eq(eventAssignments.payrollId, created.id));
    const income = candidates.reduce((s, c) => s + Number(c.price), 0);
    const vutc = candidates.reduce((s, c) => s + Number(c.vutcShare), 0);
    const rentals = candidates.reduce((s, c) => s + Number(c.rentalPrice), 0);
    await tx
      .update(payrolls)
      .set({
        totalIncome: income.toFixed(2),
        totalPayout: Number(sums?.payout ?? 0).toFixed(2),
        totalVutcShare: vutc.toFixed(2),
        totalRentals: rentals.toFixed(2),
      })
      .where(eq(payrolls.id, created.id));
    return created.id;
  });
  await audit({ action: "payroll.created", userId: admin.id, entityType: "payroll", entityId: payrollId, detail: `${ids.length} events` });
  revalidatePath("/manage/payroll");
  revalidatePath("/manage/events");
  revalidatePath("/dashboard");
  redirect(`/manage/payroll/${payrollId}`);
}

/** Records the date the payroll was paid out to staff. */
export async function setPayrollPaidOut(form: FormData): Promise<void> {
  const admin = await assertRole("bus_mgmt");
  const id = Number(form.get("payrollId"));
  const date = String(form.get("paidOutAt") ?? "");
  if (!Number.isInteger(id) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) redirect(`/manage/payroll/${id}?msg=invalid`);
  await db.update(payrolls).set({ paidOutAt: date }).where(eq(payrolls.id, id));
  await audit({ action: "payroll.paid_out", userId: admin.id, entityType: "payroll", entityId: id, detail: date });
  revalidatePath(`/manage/payroll/${id}`);
  revalidatePath("/manage/payroll");
  revalidatePath("/dashboard");
  redirect(`/manage/payroll/${id}?msg=saved`);
}
