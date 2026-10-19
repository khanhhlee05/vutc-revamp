import "server-only";
import { and, asc, count, countDistinct, desc, eq, gte, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventAssignments, events, notifications, payrolls, user, staffProfiles } from "@/db/schema";
import { PAST_STATUSES } from "./status";
import { todayString } from "@/lib/time";

/** The viewer's assignments joined to their events, newest first. */
export async function getMyAssignments(userId: string) {
  return db
    .select({
      id: eventAssignments.id,
      role: eventAssignments.role,
      pay: eventAssignments.pay,
      hasDeduction: eventAssignments.hasDeduction,
      signedUpAt: eventAssignments.signedUpAt,
      payrollId: eventAssignments.payrollId,
      event: {
        id: events.id,
        name: events.name,
        orgName: events.orgName,
        status: events.status,
        eventDate: events.eventDate,
        startAt: events.startAt,
        loadInAt: events.loadInAt,
        location: events.location,
      },
    })
    .from(eventAssignments)
    .innerJoin(events, eq(events.id, eventAssignments.eventId))
    .where(eq(eventAssignments.userId, userId))
    .orderBy(desc(events.eventDate));
}

/** Events opened most recently for signup. */
export async function getRecentlyOpened(limit = 8) {
  return db
    .select({
      id: events.id,
      name: events.name,
      orgName: events.orgName,
      eventDate: events.eventDate,
      loadInAt: events.loadInAt,
      startAt: events.startAt,
      crewSlots: events.crewSlots,
      signedUp: count(eventAssignments.id),
    })
    .from(events)
    .leftJoin(eventAssignments, eq(eventAssignments.eventId, events.id))
    .where(eq(events.status, "open"))
    .groupBy(events.id)
    .orderBy(desc(events.openedAt), asc(events.eventDate))
    .limit(limit);
}

export async function getStaffNotifications() {
  return db
    .select()
    .from(notifications)
    .where(and(eq(notifications.isVisible, true), eq(notifications.audience, "staff")))
    .orderBy(desc(notifications.priority), desc(notifications.createdAt));
}

/** Pay this calendar month and the most recent payroll's total for the viewer. */
export async function getMyPaySummary(userId: string) {
  const today = todayString();
  const monthStart = `${today.slice(0, 7)}-01`;
  const [[month], latest] = await Promise.all([
    db
      .select({ total: sql<string>`coalesce(sum(${eventAssignments.pay}), 0)` })
      .from(eventAssignments)
      .innerJoin(events, eq(events.id, eventAssignments.eventId))
      .where(
        and(
          eq(eventAssignments.userId, userId),
          gte(events.eventDate, monthStart),
          inArray(events.status, PAST_STATUSES),
        ),
      ),
    db
      .select({
        payrollId: payrolls.id,
        paidOutAt: payrolls.paidOutAt,
        createdAt: payrolls.createdAt,
        total: sql<string>`coalesce(sum(${eventAssignments.pay}), 0)`,
      })
      .from(payrolls)
      .innerJoin(
        eventAssignments,
        and(eq(eventAssignments.payrollId, payrolls.id), eq(eventAssignments.userId, userId)),
      )
      .groupBy(payrolls.id)
      .orderBy(desc(payrolls.createdAt))
      .limit(1),
  ]);
  return { thisMonth: month?.total ?? "0", lastPayroll: latest[0] ?? null };
}

/** How many of the last 50 completed events the viewer worked. */
export async function getRecentWorkCount(userId: string) {
  const recent = db
    .select({ id: events.id })
    .from(events)
    .where(inArray(events.status, PAST_STATUSES))
    .orderBy(desc(events.eventDate))
    .limit(50)
    .as("recent");
  const [row] = await db
    .select({ worked: countDistinct(eventAssignments.eventId) })
    .from(eventAssignments)
    .innerJoin(recent, eq(recent.id, eventAssignments.eventId))
    .where(eq(eventAssignments.userId, userId));
  return row?.worked ?? 0;
}

/** Distinct non-cancelled events worked per active staff member. */
export async function getLeaderboard(sinceDate?: string) {
  const conditions = [
    notInArray(events.status, ["cancelled", "archived", "requested"]),
    notInArray(eventAssignments.role, ["rental_pickup", "rental_dropoff"]),
    eq(staffProfiles.isActive, true),
  ];
  if (sinceDate) conditions.push(gte(events.eventDate, sinceDate));
  return db
    .select({
      userId: user.id,
      name: user.name,
      gradYear: staffProfiles.gradYear,
      worked: countDistinct(eventAssignments.eventId),
    })
    .from(eventAssignments)
    .innerJoin(events, eq(events.id, eventAssignments.eventId))
    .innerJoin(user, eq(user.id, eventAssignments.userId))
    .innerJoin(staffProfiles, eq(staffProfiles.userId, user.id))
    .where(and(...conditions))
    .groupBy(user.id, user.name, staffProfiles.gradYear)
    .orderBy(desc(countDistinct(eventAssignments.eventId)), asc(user.name));
}

/** Aug 1 of the current academic year, as "YYYY-MM-DD". */
export function academicYearStart(today = todayString()): string {
  const year = Number(today.slice(0, 4));
  const month = Number(today.slice(5, 7));
  return `${month >= 8 ? year : year - 1}-08-01`;
}
