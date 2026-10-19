import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { formatDate, formatMoney } from "@/lib/format";
import { createPayroll } from "@/lib/pay/payroll-actions";
import { listPayrollCandidates, listPayrolls } from "@/lib/pay/queries";

export const metadata: Metadata = { title: "Payroll" };

export default async function PayrollPage(props: { searchParams: Promise<{ msg?: string }> }) {
  await requireRole("bus_mgmt");
  const { msg } = await props.searchParams;
  const [rolls, candidates] = await Promise.all([listPayrolls(), listPayrollCandidates()]);
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Payroll</h1>
      {msg === "empty" ? <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">No completed events are waiting for payroll.</p> : null}
      <section className="rounded border p-4 space-y-3">
        <h2 className="font-semibold">Ready for the next payroll ({candidates.length})</h2>
        {candidates.length ? (
          <ul className="text-sm divide-y">
            {candidates.map((c) => (
              <li key={c.id} className="py-1 flex gap-4">
                <span className="w-32 text-gray-600">{formatDate(c.eventDate, { weekday: undefined })}</span>
                <Link href={`/manage/events/${c.id}`} className="hover:underline">#{c.id} {c.name}</Link>
                <span className="ml-auto">{formatMoney(c.price)}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">Submit timesheets to queue events here.</p>
        )}
        <form action={createPayroll}>
          <button type="submit" disabled={candidates.length === 0} className="bg-brand text-white px-4 py-2 rounded text-sm disabled:opacity-50">
            Create payroll from these events
          </button>
        </form>
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Past payrolls</h2>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-1">#</th><th className="py-1">Created</th><th className="py-1">Events</th><th className="py-1 text-right">Income</th><th className="py-1 text-right">Payout</th><th className="py-1 text-right">VUTC share</th><th className="py-1">Paid out</th>
            </tr>
          </thead>
          <tbody>
            {rolls.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-1"><Link href={`/manage/payroll/${r.id}`} className="underline">{r.id}</Link></td>
                <td className="py-1">{formatDate(r.createdAt, { weekday: undefined })}</td>
                <td className="py-1">{r.eventCount}</td>
                <td className="py-1 text-right">{formatMoney(r.totalIncome)}</td>
                <td className="py-1 text-right">{formatMoney(r.totalPayout)}</td>
                <td className="py-1 text-right">{formatMoney(r.totalVutcShare)}</td>
                <td className="py-1">{r.paidOutAt ? formatDate(r.paidOutAt, { weekday: undefined }) : <span className="text-amber-700">pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
