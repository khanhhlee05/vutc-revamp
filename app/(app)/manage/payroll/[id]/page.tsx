import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { STAFF_ROLE_LABELS } from "@/lib/events/eligibility";
import { formatDate, formatMoney } from "@/lib/format";
import { setPayrollPaidOut } from "@/lib/pay/payroll-actions";
import { getPayroll } from "@/lib/pay/queries";

export const metadata: Metadata = { title: "Payroll Detail" };

export default async function PayrollDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  await requireRole("bus_mgmt");
  const { id } = await props.params;
  const { msg } = await props.searchParams;
  const data = await getPayroll(Number(id));
  if (!data) notFound();
  const { payroll, events, perWorker } = data;
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-4">
        <h1 className="text-2xl font-bold">Payroll #{payroll.id}</h1>
        <span className="text-sm text-muted-foreground">created {formatDate(payroll.createdAt)}</span>
        <a href={`/manage/payroll/${payroll.id}/payroll.pdf`} className="text-sm underline">Download PDF</a>
      </div>
      {msg === "saved" ? <p role="status" className="rounded border border-success-border bg-success-soft p-3 text-sm">Payout date saved.</p> : null}
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded border p-4 space-y-2 text-sm">
          <h2 className="font-semibold">Pay summary</h2>
          <ul className="divide-y">
            {perWorker.map((w) => (
              <li key={w.userId} className="py-1 flex justify-between"><span>{w.name}</span><span>{formatMoney(w.total)}</span></li>
            ))}
          </ul>
          <dl className="grid grid-cols-[10rem_1fr] gap-y-0.5 border-t pt-2">
            <dt className="font-semibold">Total payout</dt><dd className="font-semibold">{formatMoney(payroll.totalPayout)}</dd>
            <dt className="text-muted-foreground">Event income</dt><dd>{formatMoney(payroll.totalIncome)}</dd>
            <dt className="text-muted-foreground">VUTC share</dt><dd>{formatMoney(payroll.totalVutcShare)}</dd>
            <dt className="text-muted-foreground">Rental pass-through</dt><dd>{formatMoney(payroll.totalRentals)}</dd>
          </dl>
        </section>
        <section className="rounded border p-4 space-y-2 text-sm">
          <h2 className="font-semibold">Payout</h2>
          <p>{payroll.paidOutAt ? `Paid out ${formatDate(payroll.paidOutAt)}.` : "Not paid out yet."}</p>
          <form action={setPayrollPaidOut} className="flex items-end gap-2">
            <input type="hidden" name="payrollId" value={payroll.id} />
            <label>
              <span className="block text-xs text-muted-foreground">Paid out on</span>
              <input name="paidOutAt" type="date" required defaultValue={payroll.paidOutAt ?? ""} className="border rounded px-2 py-1" />
            </label>
            <button type="submit" className="bg-brand text-white px-3 py-1.5 rounded">Save</button>
          </form>
        </section>
      </div>
      <section className="space-y-3">
        <h2 className="font-semibold">Events</h2>
        {events.map((e) => (
          <div key={e.id} className="rounded border p-3 text-sm">
            <div className="flex flex-wrap gap-4 font-medium">
              <Link href={`/manage/events/${e.id}`} className="hover:underline">#{e.id} {e.name}</Link>
              <span className="text-muted-foreground">{formatDate(e.eventDate, { weekday: undefined })}</span>
              <span className="ml-auto">{formatMoney(e.price)}</span>
            </div>
            <ul className="mt-1 grid gap-0.5 sm:grid-cols-2">
              {e.assignments.map((a) => (
                <li key={a.id} className="flex justify-between gap-2">
                  <span>{a.user.name} <span className="text-muted-foreground">{STAFF_ROLE_LABELS[a.role]}{a.hasDeduction ? " (deduction)" : ""}</span></span>
                  <span>{formatMoney(a.pay)}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-1">VUTC share {formatMoney(e.vutcShare)}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
