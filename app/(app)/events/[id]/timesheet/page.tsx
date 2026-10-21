import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { EventTabs } from "@/components/manage/event-tabs";
import { can, requireUser } from "@/lib/auth/session";
import { STAFF_ROLE_LABELS } from "@/lib/events/eligibility";
import { STATUS_LABELS } from "@/lib/events/status";
import { formatDate, formatMoney } from "@/lib/format";
import { canSubmitTimesheet, getTimesheetEvent, TIMESHEET_STATUSES } from "@/lib/pay/queries";
import { defaultFractions } from "@/lib/pay/split";
import { submitTimesheet } from "@/lib/pay/timesheet-actions";

export const metadata: Metadata = { title: "Timesheet" };

const MESSAGES: Record<string, string> = {
  saved: "Timesheet saved and pay calculated. The event is marked completed.",
  locked: "This event is past payroll; the timesheet can no longer change.",
};

export default async function TimesheetPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const viewer = await requireUser();
  const { id } = await props.params;
  const { msg } = await props.searchParams;
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();
  const event = await getTimesheetEvent(eventId);
  if (!event) notFound();
  if (!canSubmitTimesheet(viewer, event)) redirect("/forbidden");
  const canManage = can(viewer, "event_mgmt");
  const editable = TIMESHEET_STATUSES.includes(event.status);
  const submitted = event.status !== "confirmed" && event.status !== "open";
  const totalPay = event.assignments.reduce((s, a) => s + Number(a.pay), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-x-4">
        <h1 className="text-2xl font-bold">
          #{event.id} {event.name}
        </h1>
        <span className="rounded bg-muted px-2 py-0.5 text-sm">{STATUS_LABELS[event.status]}</span>
        <span className="text-sm text-muted-foreground">{formatDate(event.eventDate)}</span>
      </div>
      <div className="flex gap-4 text-sm">
        <Link href={`/events/${event.id}`} className="underline">Back to event</Link>
        {canManage ? <EventTabs id={event.id} active="timesheet" /> : null}
      </div>
      {msg && MESSAGES[msg] ? (
        <p role="status" className="rounded border border-success-border bg-success-soft p-3 text-sm">{MESSAGES[msg]}</p>
      ) : null}
      <p className="text-sm text-foreground/80">
        Set each person&apos;s share of run time and load in/out in tenths (10 = the whole event). Run time
        is fixed for operators. Event price {formatMoney(event.price)}; pay is computed from the packages on
        the quote.
      </p>

      <form action={submitTimesheet} className="space-y-4">
        <input type="hidden" name="eventId" value={event.id} />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="py-1">Staff</th>
              <th className="py-1">Role</th>
              <th className="py-1">Load (0-10)</th>
              <th className="py-1">Run (0-10)</th>
              <th className="py-1">Deduction</th>
              <th className="py-1">Note</th>
              {submitted ? <th className="py-1 text-right">Pay</th> : null}
            </tr>
          </thead>
          <tbody>
            {event.assignments.map((a) => {
              const d = defaultFractions(a.role);
              const run = submitted ? Math.round(Number(a.runFraction) * 10) : Math.round(d.run * 10);
              const load = submitted ? Math.round(Number(a.loadFraction) * 10) : Math.round(d.load * 10);
              return (
                <tr key={a.id} className="border-t">
                  <td className="py-1.5">{a.user.name}</td>
                  <td className="py-1.5">{STAFF_ROLE_LABELS[a.role]}</td>
                  <td className="py-1.5">
                    <input name={`load-${a.id}`} type="number" min={0} max={10} defaultValue={load} readOnly={d.loadLocked || !editable} className="w-16 border rounded px-2 py-1" />
                  </td>
                  <td className="py-1.5">
                    <input name={`run-${a.id}`} type="number" min={0} max={10} defaultValue={run} readOnly={d.runLocked || !editable} className="w-16 border rounded px-2 py-1" />
                  </td>
                  <td className="py-1.5">
                    <input name={`deduction-${a.id}`} type="checkbox" defaultChecked={a.hasDeduction} disabled={!editable} />
                  </td>
                  <td className="py-1.5">
                    <input name={`note-${a.id}`} defaultValue={a.notes} maxLength={1000} readOnly={!editable} className="w-full border rounded px-2 py-1" />
                  </td>
                  {submitted ? <td className="py-1.5 text-right">{formatMoney(a.pay)}</td> : null}
                </tr>
              );
            })}
          </tbody>
          {submitted ? (
            <tfoot>
              <tr className="border-t font-semibold">
                <td colSpan={6} className="py-1.5 text-right">Staff total</td>
                <td className="py-1.5 text-right">{formatMoney(totalPay)}</td>
              </tr>
              <tr>
                <td colSpan={6} className="py-1 text-right text-muted-foreground">VUTC share</td>
                <td className="py-1 text-right">{formatMoney(event.vutcShare)}</td>
              </tr>
            </tfoot>
          ) : null}
        </table>
        {event.assignments.length === 0 ? (
          <p className="text-sm text-warning">
            No staff are assigned. <Link href={`/manage/events/${event.id}/staff`} className="underline">Add staff</Link> before submitting.
          </p>
        ) : null}
        <label className="block text-sm">
          <span className="block mb-1 font-medium">Head tech notes</span>
          <textarea name="htNotes" rows={4} maxLength={5000} defaultValue={event.htNotes} readOnly={!editable} className="w-full border rounded px-3 py-2" />
        </label>
        {editable ? (
          <button type="submit" disabled={event.assignments.length === 0} className="bg-brand text-white px-5 py-2 rounded text-sm disabled:opacity-50">
            {submitted ? "Recalculate and save" : "Submit timesheet"}
          </button>
        ) : (
          <p className="text-sm text-muted-foreground">Locked: this event is on payroll #{event.payrollId}.</p>
        )}
      </form>
    </div>
  );
}
