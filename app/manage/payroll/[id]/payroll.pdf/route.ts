import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { hasRole } from "@/lib/auth/roles";
import { STAFF_ROLE_LABELS } from "@/lib/events/eligibility";
import { formatDate } from "@/lib/format";
import { getPayroll } from "@/lib/pay/queries";
import { renderPayrollPdf } from "@/lib/pdf/payroll";

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user || !hasRole(user.roles, "bus_mgmt")) return new Response("Forbidden", { status: 403 });
  const { id } = await ctx.params;
  const data = await getPayroll(Number(id));
  if (!data) notFound();
  const dates = data.events.map((e) => e.eventDate).sort();
  const pdf = await renderPayrollPdf({
    payrollId: data.payroll.id,
    createdDate: formatDate(data.payroll.createdAt),
    paidOutDate: data.payroll.paidOutAt ? formatDate(data.payroll.paidOutAt) : "",
    rangeStart: dates[0] ? formatDate(dates[0]) : "",
    rangeEnd: dates.at(-1) ? formatDate(dates.at(-1)!) : "",
    events: data.events.map((e) => ({
      id: e.id,
      name: e.name,
      date: formatDate(e.eventDate, { weekday: undefined }),
      price: Number(e.price),
      vutcShare: Number(e.vutcShare),
      workers: e.assignments.map((a) => ({
        name: a.user.name,
        role: STAFF_ROLE_LABELS[a.role],
        pay: Number(a.pay),
        deduction: a.hasDeduction,
      })),
    })),
    perWorker: data.perWorker.map((w) => ({ name: w.name, total: Number(w.total) })),
    totals: {
      income: Number(data.payroll.totalIncome),
      payout: Number(data.payroll.totalPayout),
      vutcShare: Number(data.payroll.totalVutcShare),
      rentals: Number(data.payroll.totalRentals),
    },
  });
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="VUTC Payroll ${data.payroll.id}.pdf"`,
      "Cache-Control": "private, no-store",
    },
  });
}
