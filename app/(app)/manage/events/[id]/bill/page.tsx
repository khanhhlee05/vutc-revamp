import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventTabs } from "@/components/manage/event-tabs";
import { Flash } from "@/components/manage/flash";
import { requireRole } from "@/lib/auth/session";
import { nextStatus } from "@/lib/events/lifecycle";
import { STATUS_LABELS } from "@/lib/events/status";
import { formatDateTime, formatMoney } from "@/lib/format";
import { sendInvoice } from "@/lib/pay/billing-actions";
import { buildInvoiceData, getInvoiceEvent } from "@/lib/pay/invoice";

export const metadata: Metadata = { title: "Invoice" };

export default async function BillPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  await requireRole("bus_mgmt");
  const { id } = await props.params;
  const { msg } = await props.searchParams;
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();
  const event = await getInvoiceEvent(eventId);
  if (!event) notFound();
  const data = buildInvoiceData(event);
  const canSend = event.status === "billed" || nextStatus(event.status, "bill") !== null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-x-4">
        <h1 className="text-2xl font-bold">
          #{event.id} {event.name}
        </h1>
        <span className="rounded bg-muted px-2 py-0.5 text-sm">{STATUS_LABELS[event.status]}</span>
      </div>
      <EventTabs id={event.id} active="bill" />
      <Flash code={msg} />
      <section className="rounded border p-4 text-sm space-y-3 max-w-2xl">
        <div className="grid grid-cols-2 gap-2">
          <div><span className="text-muted-foreground">Bill to</span><div>{data.orgName}<br />{data.contactName} · {data.contactEmail}</div></div>
          <div><span className="text-muted-foreground">Invoice date / due</span><div>{data.issuedDate} / {data.dueDate}</div></div>
        </div>
        <table className="w-full">
          <thead>
            <tr className="text-left text-muted-foreground"><th className="py-1">Description</th><th className="py-1 text-right">Unit</th><th className="py-1 text-right">Qty</th><th className="py-1 text-right">Total</th></tr>
          </thead>
          <tbody>
            {data.lines.map((l, i) => (
              <tr key={i} className="border-t"><td className="py-1">{l.name}</td><td className="py-1 text-right">{formatMoney(l.unitPrice)}</td><td className="py-1 text-right">{l.quantity}</td><td className="py-1 text-right">{formatMoney(l.total)}</td></tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t"><td colSpan={3} className="py-1 text-right text-muted-foreground">Subtotal</td><td className="py-1 text-right">{formatMoney(data.subtotal)}</td></tr>
            {data.rentalPrice > 0 ? <tr><td colSpan={3} className="py-1 text-right text-muted-foreground">Rentals</td><td className="py-1 text-right">{formatMoney(data.rentalPrice)}</td></tr> : null}
            {data.discount > 0 ? <tr><td colSpan={3} className="py-1 text-right text-muted-foreground">Discount</td><td className="py-1 text-right">-{formatMoney(data.discount)}</td></tr> : null}
            <tr className="font-semibold"><td colSpan={3} className="py-1 text-right">Total</td><td className="py-1 text-right">{formatMoney(data.total)}</td></tr>
          </tfoot>
        </table>
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t">
          <a href={`/manage/events/${event.id}/invoice.pdf`} className="underline">Preview PDF</a>
          <form action={sendInvoice} className="ml-auto">
            <input type="hidden" name="eventId" value={event.id} />
            <button type="submit" disabled={!canSend} className="bg-brand text-white px-4 py-2 rounded disabled:opacity-50">
              {event.status === "billed" ? "Re-send invoice" : "Email invoice to client"}
            </button>
          </form>
        </div>
        <p className="text-xs text-muted-foreground">
          {event.billSentAt ? `Last sent ${formatDateTime(event.billSentAt)}.` : "Not sent yet."}{" "}
          {canSend ? "" : "Invoices are sent after the timesheet is submitted."}
        </p>
      </section>
    </div>
  );
}
