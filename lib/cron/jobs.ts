import "server-only";
import { and, asc, eq, gt, inArray, lte, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { eventAssignments, events, notifications, staffProfiles, user } from "@/db/schema";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";
import { formatDate, formatTime } from "@/lib/format";
import { addDays, todayString } from "@/lib/time";

/** Opens events whose auto-open date is today or earlier. Runs in the evening job. */
export async function autoOpenEvents(today = todayString()) {
  const opened = await db
    .update(events)
    .set({ status: "open", openedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(events.status, "confirmed"), eq(events.autoOpen, true), lte(events.openOn, today)))
    .returning({ id: events.id, name: events.name });
  for (const e of opened) {
    await audit({ action: "event.open", entityType: "event", entityId: e.id, detail: "auto-open" });
  }
  return opened;
}

/** Emails the daily digest of open events and notices to active staff who opted in. */
export async function sendStaffDigest() {
  const [open, notes, recipients] = await Promise.all([
    db
      .select({
        id: events.id,
        name: events.name,
        orgName: events.orgName,
        eventDate: events.eventDate,
        loadInAt: events.loadInAt,
        startAt: events.startAt,
        location: events.location,
        crewSlots: events.crewSlots,
        signedUp: sql<number>`(select count(*) from ${eventAssignments} a where a.event_id = ${events.id})`,
      })
      .from(events)
      .where(and(eq(events.status, "open"), eq(events.notifyStaff, true)))
      .orderBy(asc(events.eventDate), asc(events.startAt)),
    db
      .select({ title: notifications.title, body: notifications.body })
      .from(notifications)
      .where(and(eq(notifications.isVisible, true), eq(notifications.includeInDigest, true), eq(notifications.audience, "staff")))
      .orderBy(asc(notifications.priority)),
    db
      .select({ email: user.email })
      .from(user)
      .innerJoin(staffProfiles, eq(staffProfiles.userId, user.id))
      .where(and(eq(staffProfiles.isActive, true), eq(staffProfiles.isApproved, true), eq(staffProfiles.receivesNotifications, true))),
  ]);
  if (recipients.length === 0 || (open.length === 0 && notes.length === 0)) {
    return { sent: 0, open: open.length, notes: notes.length };
  }
  const lines: string[] = [];
  if (notes.length) {
    lines.push("NOTICES", ...notes.map((n) => `- ${n.title}${n.body ? `: ${n.body}` : ""}`), "");
  }
  if (open.length) {
    lines.push("EVENTS OPEN FOR SIGNUP");
    for (const e of open) {
      const loadIn = e.loadInAt ? formatTime(e.loadInAt) : formatTime(e.startAt);
      lines.push(
        `- ${formatDate(e.eventDate)} · ${e.name} (${e.orgName}) · ${e.location} · load in ${loadIn} · staff ${e.signedUp}/${e.crewSlots}`,
        `  ${env.NEXT_PUBLIC_APP_URL}/events/${e.id}`,
      );
    }
    lines.push("", `Sign up: ${env.NEXT_PUBLIC_APP_URL}/events`);
  }
  lines.push("", "You receive this because digest emails are on in your account settings.");
  // One message per recipient keeps addresses private.
  let sent = 0;
  for (const r of recipients) {
    try {
      await sendEmail({ to: r.email, subject: "VUTC daily digest", text: lines.join("\n") });
      sent++;
    } catch (err) {
      console.error("digest send failed", r.email, err);
    }
  }
  return { sent, open: open.length, notes: notes.length };
}

/** Warns the events inbox when an event loading in today or tomorrow lacks senior staff. */
export async function checkSeniorCoverage(today = todayString()) {
  const tomorrow = addDays(today, 1);
  const rows = await db
    .select({
      id: events.id,
      name: events.name,
      eventDate: events.eventDate,
      seniorStaffSlots: events.seniorStaffSlots,
      seniors: sql<number>`(select count(*) from ${eventAssignments} a where a.event_id = ${events.id} and a.role = 'senior_staff')`,
    })
    .from(events)
    .where(
      and(
        inArray(events.status, ["confirmed", "open"]),
        gt(events.seniorStaffSlots, 0),
        or(eq(events.eventDate, today), eq(events.eventDate, tomorrow)),
      ),
    );
  const short = rows.filter((r) => r.seniors < r.seniorStaffSlots);
  if (short.length === 0) return { checked: rows.length, short: 0 };
  await sendEmail({
    to: env.EVENTS_INBOX,
    subject: `Senior staff missing on ${short.length} upcoming event${short.length === 1 ? "" : "s"}`,
    text: short
      .map((r) => `#${r.id} ${r.name} on ${formatDate(r.eventDate)}: ${r.seniors}/${r.seniorStaffSlots} senior staff\n${env.NEXT_PUBLIC_APP_URL}/manage/events/${r.id}/staff`)
      .join("\n\n"),
  });
  return { checked: rows.length, short: short.length };
}
