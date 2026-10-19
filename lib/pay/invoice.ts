import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { events } from "@/db/schema";
import { lineTotal, quoteSubtotal, quoteTotal } from "@/lib/events/pricing";
import { formatDate, formatTime } from "@/lib/format";
import type { QuoteData } from "@/lib/pdf/quote";
import { addDays, todayString, toZonedDateString } from "@/lib/time";

export const VUTC_ACCOUNT_NUMBER = "4-26780";
export const INVOICE_DUE_DAYS = 30;

export async function getInvoiceEvent(id: number) {
  const event = await db.query.events.findFirst({
    where: eq(events.id, id),
    with: { lineItems: true, customQuoteItems: true },
  });
  return event ?? null;
}

export type InvoiceEvent = NonNullable<Awaited<ReturnType<typeof getInvoiceEvent>>>;

/** Builds the invoice document data from an event's quote lines. */
export function buildInvoiceData(event: InvoiceEvent): QuoteData & { dueDate: string } {
  const billDate = event.billedAt ? toZonedDateString(event.billedAt) : todayString();
  const dueDate = addDays(billDate, INVOICE_DUE_DAYS);
  const subtotal = quoteSubtotal(event.lineItems, event.customQuoteItems);
  const total = quoteTotal(subtotal, event.rentalPrice, event.discount);
  return {
    kind: "invoice",
    eventId: event.id,
    eventName: event.name,
    orgName: event.orgName,
    contactName: event.contactName,
    contactEmail: event.contactEmail,
    advisorName: event.advisorName,
    advisorEmail: event.advisorEmail,
    accountIndex: event.accountIndex,
    eventDate: formatDate(event.eventDate),
    timeRange: `${formatTime(event.startAt)} to ${formatTime(event.endAt)}`,
    location: event.location,
    issuedDate: formatDate(billDate),
    dueDate: formatDate(dueDate),
    lines: [
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
    ],
    subtotal,
    rentalPrice: Number(event.rentalPrice),
    rentalDescription: event.rentalDescription,
    discount: Number(event.discount),
    total,
    notice: `Due ${formatDate(dueDate)}. VUTC account number ${VUTC_ACCOUNT_NUMBER}. A finance charge of 10% is added to balances unpaid after ${INVOICE_DUE_DAYS} days. Payment is transferred through the university's Banner system; contact the Office of Student Involvement with account questions.`,
  };
}
