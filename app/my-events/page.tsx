import type { Metadata } from "next";
import Link from "next/link";
import { MessageBanner } from "@/components/events/message-banner";
import { requireUser } from "@/lib/auth/session";
import { canDrop, STAFF_ROLE_LABELS } from "@/lib/events/eligibility";
import { dropEvent } from "@/lib/events/signup-actions";
import { getMyAssignments } from "@/lib/events/staff-queries";
import { PAST_STATUSES, STATUS_LABELS } from "@/lib/events/status";
import { formatDate, formatMoney } from "@/lib/format";
import { todayString } from "@/lib/time";

export const metadata: Metadata = { title: "My Events" };

export default async function MyEventsPage(props: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const user = await requireUser();
  const { msg } = await props.searchParams;
  const rows = await getMyAssignments(user.id);
  const today = todayString();
  const upcoming = rows.filter(
    (r) => r.event.eventDate >= today && !PAST_STATUSES.includes(r.event.status) && r.event.status !== "cancelled",
  );
  const past = rows.filter((r) => !upcoming.includes(r));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">My Events</h1>
      <MessageBanner code={msg} />
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Upcoming</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-gray-600">
            You are not signed up for anything.{" "}
            <Link href="/events" className="underline">
              Find an event
            </Link>
            .
          </p>
        ) : (
          <ul className="divide-y rounded border">
            {upcoming.slice().reverse().map((r) => (
              <li key={r.id} className="p-3 text-sm flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="w-36 text-gray-600">{formatDate(r.event.eventDate)}</span>
                <Link href={`/events/${r.event.id}`} className="font-medium hover:underline">
                  {r.event.name}
                </Link>
                <span className="text-gray-700">{STAFF_ROLE_LABELS[r.role]}</span>
                <span className="text-xs rounded bg-muted px-2 py-0.5">{STATUS_LABELS[r.event.status]}</span>
                <span className="ml-auto">
                  {canDrop(r.event) ? (
                    <form action={dropEvent}>
                      <input type="hidden" name="eventId" value={r.event.id} />
                      <input type="hidden" name="role" value={r.role} />
                      <input type="hidden" name="returnTo" value="/my-events" />
                      <button type="submit" className="underline text-red-700">
                        Drop
                      </button>
                    </form>
                  ) : (
                    <span className="text-xs text-gray-500">Contact your head tech to drop</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Past</h2>
        {past.length === 0 ? (
          <p className="text-sm text-gray-600">No past events yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-1">Date</th>
                <th className="py-1">Event</th>
                <th className="py-1">Role</th>
                <th className="py-1">Status</th>
                <th className="py-1 text-right">Pay</th>
              </tr>
            </thead>
            <tbody>
              {past.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-1">{formatDate(r.event.eventDate)}</td>
                  <td className="py-1">
                    <Link href={`/events/${r.event.id}`} className="hover:underline">
                      {r.event.name}
                    </Link>
                  </td>
                  <td className="py-1">{STAFF_ROLE_LABELS[r.role]}</td>
                  <td className="py-1">{STATUS_LABELS[r.event.status]}</td>
                  <td className="py-1 text-right">
                    {PAST_STATUSES.includes(r.event.status) ? formatMoney(r.pay) : ""}
                    {r.hasDeduction ? <span className="text-xs text-red-700"> (deduction)</span> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
