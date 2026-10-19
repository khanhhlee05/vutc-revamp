import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { STATUS_LABELS } from "@/lib/events/status";
import { formatDate, formatMoney } from "@/lib/format";
import { listBillingQueue } from "@/lib/pay/queries";
import { todayString } from "@/lib/time";

export const metadata: Metadata = { title: "Billing" };

function daysSince(date: Date | null): number | null {
  if (!date) return null;
  return Math.floor((Date.now() - date.getTime()) / 86_400_000);
}

export default async function BillingPage() {
  await requireRole("bus_mgmt");
  const { toInvoice, outstanding } = await listBillingQueue();
  const today = todayString();
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Billing</h1>
      <section className="space-y-2">
        <h2 className="font-semibold">Ready to invoice ({toInvoice.length})</h2>
        {toInvoice.length === 0 ? <p className="text-sm text-gray-600">Nothing waiting.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-600"><th className="py-1">Date</th><th className="py-1">Event</th><th className="py-1">Organization</th><th className="py-1">Status</th><th className="py-1 text-right">Total</th><th className="py-1" /></tr></thead>
            <tbody>
              {toInvoice.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="py-1">{formatDate(e.eventDate, { weekday: undefined })}</td>
                  <td className="py-1"><Link href={`/manage/events/${e.id}`} className="hover:underline">#{e.id} {e.name}</Link></td>
                  <td className="py-1">{e.orgName}</td>
                  <td className="py-1">{STATUS_LABELS[e.status]}</td>
                  <td className="py-1 text-right">{formatMoney(e.price)}</td>
                  <td className="py-1 text-right"><Link href={`/manage/events/${e.id}/bill`} className="underline">Invoice</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Outstanding invoices ({outstanding.length})</h2>
        {outstanding.length === 0 ? <p className="text-sm text-gray-600">All paid.</p> : (
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-600"><th className="py-1">Sent</th><th className="py-1">Event</th><th className="py-1">Organization</th><th className="py-1">Account</th><th className="py-1 text-right">Total</th><th className="py-1 text-right">Days</th></tr></thead>
            <tbody>
              {outstanding.map((e) => {
                const days = daysSince(e.billSentAt);
                return (
                  <tr key={e.id} className={`border-t ${days !== null && days > 30 ? "text-red-700" : ""}`}>
                    <td className="py-1">{e.billSentAt ? formatDate(e.billSentAt, { weekday: undefined }) : "not sent"}</td>
                    <td className="py-1"><Link href={`/manage/events/${e.id}`} className="hover:underline">#{e.id} {e.name}</Link></td>
                    <td className="py-1">{e.orgName}</td>
                    <td className="py-1">{e.accountIndex}</td>
                    <td className="py-1 text-right">{formatMoney(e.price)}</td>
                    <td className="py-1 text-right">{days ?? ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <p className="text-xs text-gray-600">Rows in red are past the 30 day due date as of {formatDate(today)}. Mark invoices paid from the event overview.</p>
      </section>
    </div>
  );
}
