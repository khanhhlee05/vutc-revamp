"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eventAssignments, staffRoleEnum, type StaffRole } from "@/db/schema";
import { audit } from "@/lib/audit";
import { assertUser } from "@/lib/auth/session";
import { canDrop, DROP_LOCK_HOURS, SIGNUP_ROLES, STAFF_ROLE_LABELS } from "./eligibility";
import { loadSignupListing } from "./signup-context";

function parseRole(value: unknown): StaffRole | null {
  const s = String(value ?? "");
  return (staffRoleEnum.enumValues as string[]).includes(s) ? (s as StaffRole) : null;
}

function parseId(value: unknown): number | null {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : null;
}

function back(form: FormData, msg: string): never {
  const to = String(form.get("returnTo") ?? "/events");
  const safe = to.startsWith("/") && !to.startsWith("//") ? to : "/events";
  const url = new URL(safe, "http://x");
  url.searchParams.set("msg", msg);
  redirect(url.pathname + url.search);
}

/** Staff self signup. Re-checks eligibility on the server. */
export async function signUpForEvent(form: FormData): Promise<void> {
  const viewer = await assertUser();
  const eventId = parseId(form.get("eventId"));
  const role = parseRole(form.get("role"));
  if (!eventId || !role || !SIGNUP_ROLES.includes(role)) back(form, "invalid");

  const listing = await loadSignupListing(viewer, eventId);
  if (!listing) back(form, "invalid");
  const decision = listing.decisions.find((d) => d.role === role);
  if (!decision || decision.state !== "can") {
    await audit({
      action: "event.signup_denied",
      userId: viewer.id,
      entityType: "event",
      entityId: eventId,
      detail: `${STAFF_ROLE_LABELS[role]}: ${decision?.label ?? "not available"}`,
    });
    back(form, "denied");
  }

  await db
    .insert(eventAssignments)
    .values({ eventId, userId: viewer.id, role })
    .onConflictDoNothing();
  await audit({
    action: "event.signup",
    userId: viewer.id,
    entityType: "event",
    entityId: eventId,
    detail: `${STAFF_ROLE_LABELS[role]} on ${listing.event.name}`,
  });
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
  back(form, "signed");
}

/** Staff drops a role they hold. Locked within DROP_LOCK_HOURS of load-in. */
export async function dropEvent(form: FormData): Promise<void> {
  const viewer = await assertUser();
  const eventId = parseId(form.get("eventId"));
  const role = parseRole(form.get("role"));
  if (!eventId || !role) back(form, "invalid");

  const listing = await loadSignupListing(viewer, eventId);
  if (!listing) back(form, "invalid");
  if (!canDrop(listing.event)) back(form, "droplocked");

  const deleted = await db
    .delete(eventAssignments)
    .where(
      and(
        eq(eventAssignments.eventId, eventId),
        eq(eventAssignments.userId, viewer.id),
        eq(eventAssignments.role, role),
      ),
    )
    .returning({ id: eventAssignments.id });
  if (deleted.length === 0) back(form, "invalid");

  const cutoff = listing.event.loadInAt ?? listing.event.startAt;
  const hoursOut = (cutoff.getTime() - Date.now()) / 3_600_000;
  const late = hoursOut < DROP_LOCK_HOURS * 2;
  await audit({
    action: late ? "event.drop_late" : "event.drop",
    userId: viewer.id,
    entityType: "event",
    entityId: eventId,
    detail: `${STAFF_ROLE_LABELS[role]} on ${listing.event.name} (${Math.round(hoursOut)}h before load-in)`,
  });
  revalidatePath("/events");
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/dashboard");
  revalidatePath("/my-events");
  back(form, late ? "droppedlate" : "dropped");
}
