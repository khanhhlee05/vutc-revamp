import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { STATUS_LABELS } from "@/lib/events/status";
import { addOrganizationComment, updateOrganization } from "@/lib/organizations/actions";
import { getOrganization } from "@/lib/organizations/queries";
import { formatDate, formatDateTime, formatMoney } from "@/lib/format";
import { OrgForm } from "../org-form";

export const metadata: Metadata = { title: "Organization" };

export default async function OrganizationPage(props: { params: Promise<{ id: string }> }) {
  await requireRole("event_mgmt");
  const { id } = await props.params;
  const orgId = Number(id);
  if (!Number.isInteger(orgId)) notFound();
  const org = await getOrganization(orgId);
  if (!org) notFound();
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">
        {org.name}
        {org.alertFlag ? <span className="ml-3 text-sm text-red-700">Alert since {org.alertDate ? formatDate(org.alertDate) : "?"}</span> : null}
      </h1>
      <div className="grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="font-semibold">Profile</h2>
          <OrgForm action={updateOrganization} initial={{ id: org.id, name: org.name, description: org.description, alertFlag: org.alertFlag }} />
        </section>
        <section className="space-y-3">
          <h2 className="font-semibold">Internal comments</h2>
          <form action={addOrganizationComment} className="space-y-2">
            <input type="hidden" name="id" value={org.id} />
            <textarea name="body" rows={3} required maxLength={2000} placeholder="Add a note for event management" className="w-full border rounded px-3 py-2 text-sm" />
            <button type="submit" className="bg-brand text-white text-sm px-3 py-1.5 rounded">Add comment</button>
          </form>
          <ul className="space-y-2 text-sm">
            {org.comments.map((c) => (
              <li key={c.id} className="rounded border p-3">
                <p className="whitespace-pre-wrap">{c.body}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {c.user?.name ?? "Unknown"} · {formatDateTime(c.createdAt)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section className="space-y-2">
        <h2 className="font-semibold">Event history</h2>
        {org.events.length === 0 ? <p className="text-sm text-gray-600">No linked events.</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-1">Date</th>
                <th className="py-1">Event</th>
                <th className="py-1">Status</th>
                <th className="py-1 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {org.events.map((e) => (
                <tr key={e.id} className="border-t">
                  <td className="py-1">{formatDate(e.eventDate, { weekday: undefined })}</td>
                  <td className="py-1">
                    <Link href={`/manage/events/${e.id}`} className="hover:underline">
                      {e.name}
                    </Link>
                  </td>
                  <td className="py-1">{STATUS_LABELS[e.status]}</td>
                  <td className="py-1 text-right">{formatMoney(e.price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
