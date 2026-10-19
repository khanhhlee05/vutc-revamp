import type { Metadata } from "next";
import Link from "next/link";
import type { EventStatus } from "@/db/schema";
import { requireRole } from "@/lib/auth/session";
import { countEventsByStatus, listManagedEvents } from "@/lib/events/manage-queries";
import { STATUS_LABELS, STATUS_ORDER } from "@/lib/events/status";
import { formatDate, formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Manage Events" };

export default async function ManageEventsPage(props: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requireRole("event_mgmt");
  const sp = await props.searchParams;
  const status = (STATUS_ORDER as string[]).includes(sp.status ?? "") ? (sp.status as EventStatus) : sp.q ? undefined : "requested";
  const [counts, rows] = await Promise.all([countEventsByStatus(), listManagedEvents({ status, q: sp.q })]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Events</h1>
        <form className="ml-auto flex gap-2" action="/manage/events">
          <input name="q" defaultValue={sp.q ?? ""} placeholder="Search name, org, contact" className="border rounded px-3 py-1.5 text-sm" />
          <button type="submit" className="text-sm underline">Search</button>
        </form>
      </div>
      <nav className="flex flex-wrap gap-2 text-sm">
        {STATUS_ORDER.map((s) => (
          <Link
            key={s}
            href={`/manage/events?status=${s}`}
            className={`rounded px-3 py-1 border ${status === s ? "bg-brand text-white border-brand" : "hover:bg-muted"}`}
          >
            {STATUS_LABELS[s]} <span className="opacity-75">({counts[s] ?? 0})</span>
          </Link>
        ))}
      </nav>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-600">No events here.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-1">#</th>
              <th className="py-1">Date</th>
              <th className="py-1">Event</th>
              <th className="py-1">Organization</th>
              <th className="py-1">Location</th>
              <th className="py-1 text-right">Price</th>
              <th className="py-1">Staff</th>
              <th className="py-1">Flags</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.id} className="border-t align-top">
                <td className="py-1.5 text-gray-600">{e.id}</td>
                <td className="py-1.5 whitespace-nowrap">{formatDate(e.eventDate, { weekday: undefined })}</td>
                <td className="py-1.5">
                  <Link href={`/manage/events/${e.id}`} className="font-medium hover:underline">
                    {e.name}
                  </Link>
                  {!status ? <span className="block text-xs text-gray-500">{STATUS_LABELS[e.status]}</span> : null}
                </td>
                <td className="py-1.5">{e.orgName}</td>
                <td className="py-1.5">{e.location}</td>
                <td className="py-1.5 text-right">{formatMoney(e.price)}</td>
                <td className="py-1.5 whitespace-nowrap">
                  {e.staffCount}/{e.crewSlots}
                </td>
                <td className="py-1.5 text-xs space-x-1">
                  {e.isPlanning ? <span className="rounded bg-gray-200 px-1.5">planning</span> : null}
                  {e.quoteSentNote ? <span className="rounded bg-blue-100 px-1.5">quoted</span> : null}
                  {e.isConfirmed ? <span className="rounded bg-green-100 px-1.5">client confirmed</span> : null}
                  {e.preOpen ? <span className="rounded bg-amber-100 px-1.5">pre-open</span> : null}
                  {e.autoOpen && e.openOn ? <span className="rounded bg-purple-100 px-1.5">auto-open {e.openOn}</span> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
