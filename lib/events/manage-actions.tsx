"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { render } from "@react-email/render";
import { db } from "@/db";
import {
  customQuoteItems,
  eventAssignments,
  events,
  packages,
  staffRoleEnum,
  user,
  type StaffRole,
} from "@/db/schema";
import { audit } from "@/lib/audit";
import { assertRole } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/send";
import { DeclineEmail, declineEmailText } from "@/lib/email/templates/decline";
import { QuoteEmail, quoteEmailText } from "@/lib/email/templates/quote";
import { env } from "@/lib/env";
import { formatDate, formatMoney, formatPhone, formatTime } from "@/lib/format";
import { renderQuotePdf } from "@/lib/pdf/quote";
import { todayString, zonedToUtc } from "@/lib/time";
import { STAFF_ROLE_LABELS } from "./eligibility";
import { isLifecycleAction, nextStatus, TRANSITIONS } from "./lifecycle";
import { getManagedEvent } from "./manage-queries";
import { lineTotal, quoteSubtotal, quoteTotal, recomputeEventPrice } from "./pricing";
import {
  customItemSchema,
  eventEditFromForm,
  eventEditSchema,
  lineItemSchema,
} from "@/lib/validation/event";
import { firstErrors } from "@/lib/validation/user";
import { eventLineItems } from "@/db/schema";

export type EventFormState = {
  errors?: Record<string, string>;
  formError?: string;
  saved?: boolean;
};

function idFrom(form: FormData, key = "eventId"): number {
  const n = Number(form.get(key));
  if (!Number.isInteger(n) || n <= 0) throw new Error("Invalid id");
  return n;
}

function revalidateEvent(id: number) {
  revalidatePath("/manage/events");
  revalidatePath(`/manage/events/${id}`);
  revalidatePath(`/events/${id}`);
  revalidatePath("/events");
  revalidatePath("/calendar");
}

/** Save the event details form. */
export async function updateEventDetails(_prev: EventFormState, form: FormData): Promise<EventFormState> {
  const admin = await assertRole("event_mgmt");
  const id = idFrom(form);
  const parsed = eventEditSchema.safeParse(eventEditFromForm(form));
  if (!parsed.success) return { errors: firstErrors(parsed.error) };
  const v = parsed.data;
  const loadInAt =
    v.loadInDate && v.loadInTime ? zonedToUtc(v.loadInDate, v.loadInTime) : v.loadInDate ? zonedToUtc(v.loadInDate, "00:00") : null;

  await db
    .update(events)
    .set({
      name: v.name,
      orgName: v.orgName,
      organizationId: v.organizationId ?? null,
      contactName: v.contactName,
      contactEmail: v.contactEmail.toLowerCase(),
      contactPhone: formatPhone(v.contactPhone),
      advisorName: v.advisorName,
      advisorEmail: v.advisorEmail?.toLowerCase() ?? "",
      accountIndex: v.accountIndex,
      isStudentOrg: v.isStudentOrg,
      location: v.location,
      eventDate: v.eventDate,
      startAt: zonedToUtc(v.eventDate, v.startTime),
      endAt: zonedToUtc(v.eventDate, v.endTime),
      soundcheckAt: v.soundcheckTime ? zonedToUtc(v.eventDate, v.soundcheckTime) : null,
      loadInAt,
      reservationStartAt: v.reservationStart ? zonedToUtc(v.eventDate, v.reservationStart) : null,
      reservationEndAt: v.reservationEnd ? zonedToUtc(v.eventDate, v.reservationEnd) : null,
      expectedAttendance: v.expectedAttendance,
      needs: v.needs,
      description: v.description,
      notes: v.notes,
      htNotes: v.htNotes,
      planningNotes: v.planningNotes,
      quoteSentNote: v.quoteSentNote,
      crewSlots: v.crewSlots,
      seniorStaffSlots: v.seniorStaffSlots,
      ahtSlots: v.ahtSlots,
      lhtSlots: v.lhtSlots,
      vhtSlots: v.vhtSlots,
      djSlots: v.djSlots,
      spotSlots: v.spotSlots,
      cameraSlots: v.cameraSlots,
      runnerSlots: v.runnerSlots,
      discount: v.discount.toFixed(2),
      rentalPrice: v.rentalPrice.toFixed(2),
      rentalDescription: v.rentalDescription,
      openOn: v.openOn ?? null,
      autoOpen: v.autoOpen,
      notifyStaff: v.notifyStaff,
      updatedAt: new Date(),
    })
    .where(eq(events.id, id));
  await recomputeEventPrice(db, id);
  await audit({ action: "event.updated", userId: admin.id, entityType: "event", entityId: id });
  revalidateEvent(id);
  return { saved: true };
}

/** Status transitions with their side effects. */
export async function transitionEvent(form: FormData): Promise<void> {
  const admin = await assertRole("event_mgmt");
  const id = idFrom(form);
  const action = form.get("action");
  const reason = String(form.get("reason") ?? "").trim().slice(0, 2000);
  if (!isLifecycleAction(action)) throw new Error("Unknown action");
  const event = await getManagedEvent(id);
  if (!event) throw new Error("Event not found");
  const to = nextStatus(event.status, action);
  if (!to) redirect(`/manage/events/${id}?msg=illegal`);

  const patch: Partial<typeof events.$inferInsert> = { status: to, updatedAt: new Date() };
  if (action === "open") patch.openedAt = new Date();
  if (action === "confirm") patch.approvedAt = patch.approvedAt ?? new Date();
  if (action === "mark_paid") patch.paidAt = new Date();
  if (action === "revert_to_billed") patch.paidAt = null;
  if (action === "cancel" || action === "deny") patch.cancelReason = reason;
  if (action === "restore") patch.cancelReason = "";

  await db.transaction(async (tx) => {
    await tx.update(events).set(patch).where(eq(events.id, id));
    if (action === "cancel" || action === "deny") {
      await tx.delete(eventAssignments).where(eq(eventAssignments.eventId, id));
    }
  });
  await audit({
    action: `event.${action}`,
    userId: admin.id,
    entityType: "event",
    entityId: id,
    detail: reason || TRANSITIONS[action].label,
  });

  if (action === "cancel" || action === "deny") {
    const data = {
      eventId: id,
      eventName: event.name,
      contactName: event.contactName,
      eventDate: formatDate(event.eventDate),
      location: event.location,
      reason,
      senderName: admin.name,
      senderEmail: admin.email,
      cancelled: action === "cancel",
    };
    try {
      await sendEmail({
        to: [event.contactEmail, ...(event.advisorEmail ? [event.advisorEmail] : [])],
        replyTo: admin.email,
        subject: `VUTC event ${action === "cancel" ? "cancelled" : "declined"}: ${event.name}`,
        text: declineEmailText(data),
        html: await render(<DeclineEmail data={data} />),
      });
    } catch (err) {
      console.error("decline email failed", err);
    }
  }
  revalidateEvent(id);
  redirect(`/manage/events/${id}?msg=${action}`);
}

const FLAGS = ["isPlanning", "preOpen", "isEmergency", "rentalsOrdered", "notifyStaff", "autoOpen", "isConfirmed"] as const;
type Flag = (typeof FLAGS)[number];

export async function toggleEventFlag(form: FormData): Promise<void> {
  const admin = await assertRole("event_mgmt");
  const id = idFrom(form);
  const flag = String(form.get("flag"));
  if (!(FLAGS as readonly string[]).includes(flag)) throw new Error("Unknown flag");
  const event = await db.query.events.findFirst({ where: eq(events.id, id) });
  if (!event) throw new Error("Event not found");
  const next = !event[flag as Flag];
  await db.update(events).set({ [flag]: next, updatedAt: new Date() }).where(eq(events.id, id));
  await audit({ action: `event.flag.${flag}`, userId: admin.id, entityType: "event", entityId: id, detail: String(next) });
  revalidateEvent(id);
  redirect(`/manage/events/${id}`);
}

export async function addLineItem(form: FormData): Promise<void> {
  const admin = await assertRole("event_mgmt");
  const id = idFrom(form);
  const parsed = lineItemSchema.safeParse({
    packageId: form.get("packageId"),
    quantity: form.get("quantity") || "1",
    description: form.get("description") ?? "",
  });
  if (!parsed.success) redirect(`/manage/events/${id}/packages?msg=invalid`);
  const pkg = await db.query.packages.findFirst({ where: eq(packages.id, parsed.data.packageId) });
  if (!pkg) redirect(`/manage/events/${id}/packages?msg=invalid`);
  await db.insert(eventLineItems).values({
    eventId: id,
    packageId: pkg.id,
    name: pkg.name,
    unitPrice: pkg.unitPrice,
    quantity: String(parsed.data.quantity),
    description: parsed.data.description,
  });
  await recomputeEventPrice(db, id);
  await audit({ action: "event.line_added", userId: admin.id, entityType: "event", entityId: id, detail: `${parsed.data.quantity} x ${pkg.name}` });
  revalidateEvent(id);
  redirect(`/manage/events/${id}/packages`);
}

export async function removeLineItem(form: FormData): Promise<void> {
  const admin = await assertRole("event_mgmt");
  const id = idFrom(form);
  const lineId = idFrom(form, "lineId");
  const [removed] = await db
    .delete(eventLineItems)
    .where(and(eq(eventLineItems.id, lineId), eq(eventLineItems.eventId, id)))
    .returning({ name: eventLineItems.name });
  if (removed) {
    await recomputeEventPrice(db, id);
    await audit({ action: "event.line_removed", userId: admin.id, entityType: "event", entityId: id, detail: removed.name });
  }
  revalidateEvent(id);
  redirect(`/manage/events/${id}/packages`);
}

export async function addCustomItem(form: FormData): Promise<void> {
  const admin = await assertRole("event_mgmt");
  const id = idFrom(form);
  const parsed = customItemSchema.safeParse({
    name: form.get("name"),
    description: form.get("description") ?? "",
    price: form.get("price"),
  });
  if (!parsed.success) redirect(`/manage/events/${id}/packages?msg=invalid`);
  await db.insert(customQuoteItems).values({
    eventId: id,
    name: parsed.data.name,
    description: parsed.data.description,
    price: parsed.data.price.toFixed(2),
  });
  await recomputeEventPrice(db, id);
  await audit({ action: "event.custom_added", userId: admin.id, entityType: "event", entityId: id, detail: parsed.data.name });
  revalidateEvent(id);
  redirect(`/manage/events/${id}/packages`);
}

export async function removeCustomItem(form: FormData): Promise<void> {
  const admin = await assertRole("event_mgmt");
  const id = idFrom(form);
  const itemId = idFrom(form, "itemId");
  await db.delete(customQuoteItems).where(and(eq(customQuoteItems.id, itemId), eq(customQuoteItems.eventId, id)));
  await recomputeEventPrice(db, id);
  await audit({ action: "event.custom_removed", userId: admin.id, entityType: "event", entityId: id });
  revalidateEvent(id);
  redirect(`/manage/events/${id}/packages`);
}

/** Email the client a PDF quote and move a new request to confirmed. */
export async function sendQuote(form: FormData): Promise<void> {
  const admin = await assertRole("event_mgmt");
  const id = idFrom(form);
  const event = await getManagedEvent(id);
  if (!event) throw new Error("Event not found");
  if (event.status !== "requested" && event.status !== "confirmed" && event.status !== "open") {
    redirect(`/manage/events/${id}/packages?msg=illegal`);
  }
  const lines = [
    ...event.lineItems.map((l) => ({
      name: l.name,
      description: l.description,
      unitPrice: Number(l.unitPrice),
      quantity: Number(l.quantity),
      total: lineTotal(l.unitPrice, l.quantity),
    })),
    ...event.customQuoteItems.map((c) => ({
      name: c.name,
      description: c.description,
      unitPrice: Number(c.price),
      quantity: 1,
      total: Number(c.price),
    })),
  ];
  if (lines.length === 0) redirect(`/manage/events/${id}/packages?msg=nolines`);
  const subtotal = quoteSubtotal(event.lineItems, event.customQuoteItems);
  const total = quoteTotal(subtotal, event.rentalPrice, event.discount);
  const timeRange = `${formatTime(event.startAt)} to ${formatTime(event.endAt)}`;
  const pdf = await renderQuotePdf({
    kind: "quote",
    eventId: event.id,
    eventName: event.name,
    orgName: event.orgName,
    contactName: event.contactName,
    contactEmail: event.contactEmail,
    advisorName: event.advisorName,
    advisorEmail: event.advisorEmail,
    accountIndex: event.accountIndex,
    eventDate: formatDate(event.eventDate),
    timeRange,
    location: event.location,
    issuedDate: formatDate(todayString()),
    lines,
    subtotal,
    rentalPrice: Number(event.rentalPrice),
    rentalDescription: event.rentalDescription,
    discount: Number(event.discount),
    total,
    notice:
      "You will receive a receipt following your event indicating the final amount charged to your account. You will be notified in advance if this amount changes from the quote. Confirm this quote on the event brief page before the event date.",
  });
  const briefUrl = `${env.NEXT_PUBLIC_APP_URL}/brief/${event.publicToken}`;
  const data = {
    eventId: event.id,
    eventName: event.name,
    contactName: event.contactName,
    eventDate: formatDate(event.eventDate),
    timeRange,
    location: event.location,
    total: formatMoney(total),
    briefUrl,
    senderName: admin.name,
  };
  await sendEmail({
    to: [event.contactEmail, ...(event.advisorEmail ? [event.advisorEmail] : [])],
    replyTo: admin.email,
    subject: `VUTC Price Quote #${event.id}: ${event.name}`,
    text: quoteEmailText(data),
    html: await render(<QuoteEmail data={data} />),
    attachments: [{ filename: `VUTC Quote ${event.id}.pdf`, content: pdf }],
  });
  const patch: Partial<typeof events.$inferInsert> = {
    approvedAt: new Date(),
    isConfirmed: false,
    quoteSentNote: `Quote sent ${formatDate(todayString())} by ${admin.name}`,
    updatedAt: new Date(),
  };
  if (event.status === "requested") patch.status = "confirmed";
  await db.update(events).set(patch).where(eq(events.id, id));
  await audit({ action: "event.quote_sent", userId: admin.id, entityType: "event", entityId: id, detail: formatMoney(total) });
  revalidateEvent(id);
  redirect(`/manage/events/${id}?msg=quote`);
}

function parseRole(value: unknown): StaffRole | null {
  const s = String(value ?? "");
  return (staffRoleEnum.enumValues as string[]).includes(s) ? (s as StaffRole) : null;
}

/** Event management places a staff member on an event directly. */
export async function addStaffToEvent(form: FormData): Promise<void> {
  const admin = await assertRole("event_mgmt");
  const id = idFrom(form);
  const userId = String(form.get("userId") ?? "");
  const role = parseRole(form.get("role"));
  if (!userId || !role) redirect(`/manage/events/${id}/staff?msg=invalid`);
  const member = await db.query.user.findFirst({ where: eq(user.id, userId) });
  const event = await db.query.events.findFirst({ where: eq(events.id, id) });
  if (!member || !event) redirect(`/manage/events/${id}/staff?msg=invalid`);
  await db
    .insert(eventAssignments)
    .values({ eventId: id, userId, role, addedByStaff: true })
    .onConflictDoNothing();
  await audit({ action: "event.staff_added", userId: admin.id, entityType: "event", entityId: id, detail: `${member.name} as ${STAFF_ROLE_LABELS[role]}` });
  try {
    await sendEmail({
      to: member.email,
      subject: `You were added to ${event.name}`,
      text: `${admin.name} added you to event #${event.id} ${event.name} on ${formatDate(event.eventDate)} as ${STAFF_ROLE_LABELS[role]}.\n${env.NEXT_PUBLIC_APP_URL}/events/${event.id}`,
    });
  } catch (err) {
    console.error("staff add email failed", err);
  }
  revalidateEvent(id);
  redirect(`/manage/events/${id}/staff`);
}

export async function removeStaffFromEvent(form: FormData): Promise<void> {
  const admin = await assertRole("event_mgmt");
  const id = idFrom(form);
  const assignmentId = idFrom(form, "assignmentId");
  const [removed] = await db
    .delete(eventAssignments)
    .where(and(eq(eventAssignments.id, assignmentId), eq(eventAssignments.eventId, id)))
    .returning({ userId: eventAssignments.userId, role: eventAssignments.role });
  if (removed) {
    await audit({ action: "event.staff_removed", userId: admin.id, entityType: "event", entityId: id, detail: `${removed.userId} ${removed.role}` });
  }
  revalidateEvent(id);
  redirect(`/manage/events/${id}/staff`);
}
