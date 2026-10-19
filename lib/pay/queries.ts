import "server-only";
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventAssignments, events, payrolls, user, type EventStatus } from "@/db/schema";
import type { CurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";

export async function getTimesheetEvent(id: number) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      lineItems: { with: { package: true }, orderBy: (t, { asc }) => [asc(t.id)] },
      customQuoteItems: true,
      assignments: { with: { user: true }, orderBy: (t, { asc }) => [asc(t.role), asc(t.signedUpAt)] },
    },
  });
  return event ?? null;
}

export type TimesheetEvent = NonNullable<Awaited<ReturnType<typeof getTimesheetEvent>>>;

/** Event management, or a head tech/DJ assigned to the event, may submit. */
export function canSubmitTimesheet(viewer: CurrentUser, event: TimesheetEvent): boolean {
  if (hasRole(viewer.roles, "event_mgmt") || hasRole(viewer.roles, "bus_mgmt")) return true;
  return event.assignments.some(
    (a) => a.userId === viewer.id && ["aht", "lht", "vht", "dj"].includes(a.role),
  );
}

export const TIMESHEET_STATUSES: EventStatus[] = ["confirmed", "open", "completed"];

export async function listPayrolls() {
  return db
    .select({
      id: payrolls.id,
      createdAt: payrolls.createdAt,
      paidOutAt: payrolls.paidOutAt,
      totalIncome: payrolls.totalIncome,
      totalPayout: payrolls.totalPayout,
      totalVutcShare: payrolls.totalVutcShare,
      eventCount: sql<number>`(select count(*) from ${events} e where e.payroll_id = ${payrolls.id})`,
    })
    .from(payrolls)
    .orderBy(desc(payrolls.id));
}

export async function listPayrollCandidates() {
  return db
    .select({ id: events.id, name: events.name, eventDate: events.eventDate, price: events.price, vutcShare: events.vutcShare })
    .from(events)
    .where(and(eq(events.status, "completed"), isNull(events.payrollId)))
    .orderBy(asc(events.eventDate));
}

export async function getPayroll(id: number) {
  const payroll = await db.query.payrolls.findFirst({ where: eq(payrolls.id, id) });
  if (!payroll) return null;
  const evs = await db.query.events.findMany({
    where: eq(events.payrollId, id),
    orderBy: (t, { asc }) => [asc(t.eventDate)],
    with: { assignments: { with: { user: true }, orderBy: (t, { asc }) => [asc(t.role)] } },
  });
  const perWorker = await db
    .select({ userId: user.id, name: user.name, total: sql<string>`sum(${eventAssignments.pay})` })
    .from(eventAssignments)
    .innerJoin(user, eq(user.id, eventAssignments.userId))
    .where(eq(eventAssignments.payrollId, id))
    .groupBy(user.id, user.name)
    .orderBy(asc(user.name));
  return { payroll, events: evs, perWorker };
}

/** Events ready to invoice, and invoices still outstanding. */
export async function listBillingQueue() {
  const rows = await db
    .select({
      id: events.id,
      name: events.name,
      orgName: events.orgName,
      status: events.status,
      eventDate: events.eventDate,
      price: events.price,
      billedAt: events.billedAt,
      billSentAt: events.billSentAt,
      payrollId: events.payrollId,
      accountIndex: events.accountIndex,
    })
    .from(events)
    .where(inArray(events.status, ["completed", "payroll_created", "billed"]))
    .orderBy(asc(events.eventDate));
  return {
    toInvoice: rows.filter((r) => r.status !== "billed"),
    outstanding: rows.filter((r) => r.status === "billed"),
  };
}
