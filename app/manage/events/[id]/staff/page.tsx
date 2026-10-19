import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventTabs } from "@/components/manage/event-tabs";
import { Flash } from "@/components/manage/flash";
import { requireRole } from "@/lib/auth/session";
import { STAFF_ROLE_LABELS } from "@/lib/events/eligibility";
import { addStaffToEvent, removeStaffFromEvent } from "@/lib/events/manage-actions";
import { getManagedEvent, listStaffForPicker } from "@/lib/events/manage-queries";
import { staffRoleEnum } from "@/db/schema";
import { formatDateTime } from "@/lib/format";

export const metadata: Metadata = { title: "Event Staffing" };

export default async function StaffPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  await requireRole("event_mgmt");
  const { id } = await props.params;
  const { msg } = await props.searchParams;
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();
  const [event, staff] = await Promise.all([getManagedEvent(eventId), listStaffForPicker()]);
  if (!event) notFound();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        #{event.id} {event.name}
      </h1>
      <EventTabs id={event.id} active="staff" />
      <Flash code={msg} />
      <section className="rounded border p-4 space-y-3">
        <h2 className="font-semibold">Assigned staff</h2>
        {event.assignments.length === 0 ? <p className="text-sm text-gray-600">Nobody yet.</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-1">Role</th>
                <th className="py-1">Name</th>
                <th className="py-1">Signed up</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {event.assignments.map((a) => (
                <tr key={a.id} className="border-t">
                  <td className="py-1">{STAFF_ROLE_LABELS[a.role]}</td>
                  <td className="py-1">
                    {a.user.name} <span className="text-xs text-gray-500">{a.user.email}</span>
                  </td>
                  <td className="py-1">
                    {formatDateTime(a.signedUpAt)}
                    {a.addedByStaff ? <span className="text-xs text-gray-500"> (added by management)</span> : null}
                  </td>
                  <td className="py-1 text-right">
                    <form action={removeStaffFromEvent}>
                      <input type="hidden" name="eventId" value={event.id} />
                      <input type="hidden" name="assignmentId" value={a.id} />
                      <button type="submit" className="text-xs underline text-red-700">Remove</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <form action={addStaffToEvent} className="flex flex-wrap items-end gap-2 border-t pt-3">
          <input type="hidden" name="eventId" value={event.id} />
          <label className="text-sm">
            <span className="block text-xs text-gray-600">Staff member</span>
            <select name="userId" required className="border rounded px-2 py-1 text-sm min-w-56">
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-xs text-gray-600">Role</span>
            <select name="role" required className="border rounded px-2 py-1 text-sm">
              {staffRoleEnum.enumValues.map((r) => (
                <option key={r} value={r}>
                  {STAFF_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </label>
          <button type="submit" className="bg-brand text-white text-sm px-3 py-1.5 rounded">Add to event</button>
          <span className="text-xs text-gray-600">Management additions skip cooldown rules and email the member.</span>
        </form>
      </section>
    </div>
  );
}
