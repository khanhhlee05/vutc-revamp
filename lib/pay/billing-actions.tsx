"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { render } from "@react-email/render";
import { db } from "@/db";
import { events } from "@/db/schema";
import { audit } from "@/lib/audit";
import { assertRole } from "@/lib/auth/session";
import { sendEmail } from "@/lib/email/send";
import { InvoiceEmail, invoiceEmailText } from "@/lib/email/templates/invoice";
import { nextStatus } from "@/lib/events/lifecycle";
import { formatMoney } from "@/lib/format";
import { renderQuotePdf } from "@/lib/pdf/quote";
import { buildInvoiceData, getInvoiceEvent } from "./invoice";

/** Emails the PDF invoice to the client and advisor and marks the event billed. */
export async function sendInvoice(form: FormData): Promise<void> {
  const admin = await assertRole("bus_mgmt");
  const id = Number(form.get("eventId"));
  if (!Number.isInteger(id)) throw new Error("Invalid event");
  const event = await getInvoiceEvent(id);
  if (!event) throw new Error("Event not found");
  const resend = event.status === "billed";
  if (!resend && !nextStatus(event.status, "bill")) redirect(`/manage/events/${id}/bill?msg=illegal`);

  if (!event.billedAt) {
    await db.update(events).set({ billedAt: new Date() }).where(eq(events.id, id));
    event.billedAt = new Date();
  }
  const data = buildInvoiceData(event);
  const pdf = await renderQuotePdf(data);
  const emailData = {
    eventId: event.id,
    eventName: event.name,
    contactName: event.contactName,
    eventDate: data.eventDate,
    total: formatMoney(data.total),
    dueDate: data.dueDate,
    senderName: admin.name,
  };
  await sendEmail({
    to: [event.contactEmail, ...(event.advisorEmail ? [event.advisorEmail] : [])],
    replyTo: admin.email,
    subject: `VUTC Bill of Services #${event.id}: ${event.name}`,
    text: invoiceEmailText(emailData),
    html: await render(<InvoiceEmail data={emailData} />),
    attachments: [{ filename: `VUTC Invoice ${event.id}.pdf`, content: pdf }],
  });
  await db
    .update(events)
    .set({ status: "billed", billSentAt: new Date(), updatedAt: new Date() })
    .where(eq(events.id, id));
  await audit({
    action: resend ? "event.invoice_resent" : "event.billed",
    userId: admin.id,
    entityType: "event",
    entityId: id,
    detail: formatMoney(data.total),
  });
  revalidatePath(`/manage/events/${id}`);
  revalidatePath("/manage/billing");
  revalidatePath("/manage/events");
  redirect(`/manage/events/${id}?msg=billed`);
}
