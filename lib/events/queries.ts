import "server-only";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { eventAssignments, events, user } from "@/db/schema";
import { ACTIVE_STATUSES, PAST_STATUSES } from "./status";
import { todayString } from "@/lib/time";

/** Full event with quote lines for the public brief page, by public token. */
export async function getEventByToken(token: string) {
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return null;
  const event = await db.query.events.findFirst({
    where: eq(events.publicToken, token),
    with: {
      lineItems: { orderBy: (t, { asc }) => [asc(t.id)] },
      customQuoteItems: { orderBy: (t, { asc }) => [asc(t.id)] },
      organization: true,
    },
  });
  return event ?? null;
}

/** Head techs and DJs on an event, for the client brief. */
export async function getEventLeads(eventId: number) {
  return db
    .select({
      role: eventAssignments.role,
      name: user.name,
      email: user.email,
    })
    .from(eventAssignments)
    .innerJoin(user, eq(user.id, eventAssignments.userId))
    .where(
      and(
        eq(eventAssignments.eventId, eventId),
        inArray(eventAssignments.role, ["aht", "lht", "vht", "dj"]),
      ),
    )
    .orderBy(asc(eventAssignments.role));
}

/** Public calendar: scheduled events from today onward. */
export async function getUpcomingPublicEvents() {
  return db
    .select({
      id: events.id,
      name: events.name,
      orgName: events.orgName,
      eventDate: events.eventDate,
      location: events.location,
    })
    .from(events)
    .where(
      and(
        inArray(events.status, ACTIVE_STATUSES),
        // eventDate is a date column; compare as string in app zone
        eq(events.isPlanning, false),
      ),
    )
    .orderBy(asc(events.eventDate))
    .then((rows) => rows.filter((r) => r.eventDate >= todayString()));
}

/** Public calendar: the most recent completed events. */
export async function getRecentPublicEvents(limit = 12) {
  return db
    .select({
      id: events.id,
      name: events.name,
      orgName: events.orgName,
      eventDate: events.eventDate,
    })
    .from(events)
    .where(inArray(events.status, PAST_STATUSES))
    .orderBy(desc(events.eventDate))
    .limit(limit);
}
