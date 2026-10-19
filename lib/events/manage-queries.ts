import "server-only";
import { and, asc, count, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  eventAssignments,
  events,
  organizations,
  packages,
  staffProfiles,
  user,
  type EventStatus,
} from "@/db/schema";

export async function countEventsByStatus(): Promise<Record<EventStatus, number>> {
  const rows = await db
    .select({ status: events.status, n: count() })
    .from(events)
    .groupBy(events.status);
  const out = Object.fromEntries(rows.map((r) => [r.status, r.n])) as Record<EventStatus, number>;
  return out;
}

export async function listManagedEvents(opts: { status?: EventStatus; q?: string }) {
  const conditions = [];
  if (opts.status) conditions.push(eq(events.status, opts.status));
  if (opts.q) {
    const like = `%${opts.q.replace(/[%_]/g, "\\$&")}%`;
    conditions.push(or(ilike(events.name, like), ilike(events.orgName, like), ilike(events.contactName, like)));
  }
  const pastish = opts.status && ["paid", "cancelled", "archived", "billed", "payroll_created", "completed"].includes(opts.status);
  return db
    .select({
      id: events.id,
      name: events.name,
      orgName: events.orgName,
      status: events.status,
      eventDate: events.eventDate,
      location: events.location,
      price: events.price,
      isPlanning: events.isPlanning,
      isConfirmed: events.isConfirmed,
      preOpen: events.preOpen,
      autoOpen: events.autoOpen,
      openOn: events.openOn,
      submittedAt: events.submittedAt,
      quoteSentNote: events.quoteSentNote,
      approvedAt: events.approvedAt,
      crewSlots: events.crewSlots,
      staffCount: sql<number>`(select count(*) from ${eventAssignments} a where a.event_id = ${events.id})`,
    })
    .from(events)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(pastish ? desc(events.eventDate) : asc(events.eventDate), asc(events.startAt))
    .limit(300);
}

export async function getManagedEvent(id: number) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: {
      organization: true,
      lineItems: { with: { package: true }, orderBy: (t, { asc }) => [asc(t.id)] },
      customQuoteItems: { orderBy: (t, { asc }) => [asc(t.id)] },
      assignments: { with: { user: true }, orderBy: (t, { asc }) => [asc(t.role), asc(t.signedUpAt)] },
    },
  });
  return event ?? null;
}

export async function listActivePackages() {
  return db
    .select()
    .from(packages)
    .where(eq(packages.isActive, true))
    .orderBy(asc(packages.category), asc(packages.sortOrder), asc(packages.name));
}

export async function listOrganizationsBrief() {
  return db
    .select({ id: organizations.id, name: organizations.name, alertFlag: organizations.alertFlag })
    .from(organizations)
    .orderBy(asc(organizations.name));
}

export async function listStaffForPicker() {
  return db
    .select({ id: user.id, name: user.name, email: user.email })
    .from(user)
    .innerJoin(staffProfiles, eq(staffProfiles.userId, user.id))
    .where(eq(staffProfiles.isActive, true))
    .orderBy(asc(user.name));
}
