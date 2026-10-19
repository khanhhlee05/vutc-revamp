import "server-only";
import { and, asc, desc, eq, inArray, ne, or } from "drizzle-orm";
import { db } from "@/db";
import {
  eventAssignments,
  events,
  user,
  type StaffRole,
} from "@/db/schema";
import type { CurrentUser } from "@/lib/auth/session";
import {
  evaluateSignup,
  type SignupDecision,
  type SignupEvent,
  type SignupHistory,
} from "./eligibility";

export type SignupListing = {
  event: typeof events.$inferSelect;
  taken: Partial<Record<StaffRole, number>>;
  workers: { name: string; role: StaffRole }[];
  decisions: SignupDecision[];
};

const SENIOR_TIER: StaffRole[] = ["senior_staff", "spot", "camera", "runner"];

function toSignupEvent(
  e: typeof events.$inferSelect,
  taken: Partial<Record<StaffRole, number>>,
): SignupEvent {
  return {
    id: e.id,
    status: e.status,
    preOpen: e.preOpen,
    isEmergency: e.isEmergency,
    openedAt: e.openedAt,
    eventDate: e.eventDate,
    loadInAt: e.loadInAt,
    startAt: e.startAt,
    crewSlots: e.crewSlots,
    seniorStaffSlots: e.seniorStaffSlots,
    ahtSlots: e.ahtSlots,
    lhtSlots: e.lhtSlots,
    vhtSlots: e.vhtSlots,
    djSlots: e.djSlots,
    spotSlots: e.spotSlots,
    cameraSlots: e.cameraSlots,
    runnerSlots: e.runnerSlots,
    taken,
  };
}

/** Everything about the viewer's own assignments needed by the rules. */
async function loadViewerHistory(userId: string) {
  const mine = await db
    .select({
      eventId: eventAssignments.eventId,
      role: eventAssignments.role,
      signedUpAt: eventAssignments.signedUpAt,
      addedByStaff: eventAssignments.addedByStaff,
      status: events.status,
      eventDate: events.eventDate,
    })
    .from(eventAssignments)
    .innerJoin(events, eq(events.id, eventAssignments.eventId))
    .where(eq(eventAssignments.userId, userId))
    .orderBy(desc(eventAssignments.signedUpAt));

  const self = mine.filter((m) => !m.addedByStaff);
  const lastEventStaff = self.find((m) => m.role === "event_staff")?.signedUpAt ?? null;
  const lastSenior = self.find((m) => SENIOR_TIER.includes(m.role))?.signedUpAt ?? null;

  return {
    mine,
    historyFor(eventId: number, eventDate: string): SignupHistory {
      const others = mine.filter((m) => m.eventId !== eventId);
      return {
        rolesOnEvent: mine.filter((m) => m.eventId === eventId).map((m) => m.role),
        lastEventStaffSignupAt: lastEventStaff,
        lastSeniorSignupAt: lastSenior,
        onOtherOpenEventAsStaff: others.some(
          (m) => m.status === "open" && m.role === "event_staff",
        ),
        onOtherOpenEventAsSenior: others.some(
          (m) => m.status === "open" && SENIOR_TIER.includes(m.role),
        ),
        hasSameDayEvent: others.some(
          (m) => m.eventDate === eventDate && m.status !== "cancelled",
        ),
      };
    },
  };
}

async function loadAssignmentsFor(eventIds: number[]) {
  if (eventIds.length === 0) return [];
  return db
    .select({
      eventId: eventAssignments.eventId,
      role: eventAssignments.role,
      name: user.name,
    })
    .from(eventAssignments)
    .innerJoin(user, eq(user.id, eventAssignments.userId))
    .where(inArray(eventAssignments.eventId, eventIds))
    .orderBy(asc(eventAssignments.role), asc(eventAssignments.id));
}

function group(rows: { eventId: number; role: StaffRole; name: string }[]) {
  const taken = new Map<number, Partial<Record<StaffRole, number>>>();
  const workers = new Map<number, { name: string; role: StaffRole }[]>();
  for (const r of rows) {
    const t = taken.get(r.eventId) ?? {};
    t[r.role] = (t[r.role] ?? 0) + 1;
    taken.set(r.eventId, t);
    const w = workers.get(r.eventId) ?? [];
    w.push({ name: r.name, role: r.role });
    workers.set(r.eventId, w);
  }
  return { taken, workers };
}

/** Events currently visible on the signup page, with the viewer's options. */
export async function loadSignupListings(viewer: CurrentUser): Promise<SignupListing[]> {
  const list = await db
    .select()
    .from(events)
    .where(
      or(
        eq(events.status, "open"),
        and(eq(events.status, "confirmed"), eq(events.preOpen, true)),
      ),
    )
    .orderBy(asc(events.eventDate), asc(events.startAt));
  const [{ taken, workers }, history] = await Promise.all([
    loadAssignmentsFor(list.map((e) => e.id)).then(group),
    loadViewerHistory(viewer.id),
  ]);
  const now = new Date();
  return list.map((event) => {
    const t = taken.get(event.id) ?? {};
    return {
      event,
      taken: t,
      workers: workers.get(event.id) ?? [],
      decisions: evaluateSignup({
        viewer: {
          userId: viewer.id,
          roles: viewer.roles,
          isActive: viewer.isActive,
          isApproved: viewer.isApproved,
        },
        event: toSignupEvent(event, t),
        history: history.historyFor(event.id, event.eventDate),
        now,
      }),
    };
  });
}

/** One event with the viewer's options, for the detail page and actions. */
export async function loadSignupListing(
  viewer: CurrentUser,
  eventId: number,
): Promise<SignupListing | null> {
  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), ne(events.status, "archived")),
  });
  if (!event) return null;
  const [{ taken, workers }, history] = await Promise.all([
    loadAssignmentsFor([event.id]).then(group),
    loadViewerHistory(viewer.id),
  ]);
  const t = taken.get(event.id) ?? {};
  return {
    event,
    taken: t,
    workers: workers.get(event.id) ?? [],
    decisions: evaluateSignup({
      viewer: {
        userId: viewer.id,
        roles: viewer.roles,
        isActive: viewer.isActive,
        isApproved: viewer.isApproved,
      },
      event: toSignupEvent(event, t),
      history: history.historyFor(event.id, event.eventDate),
    }),
  };
}
