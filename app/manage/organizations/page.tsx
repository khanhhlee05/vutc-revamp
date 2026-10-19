import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { listOrganizations } from "@/lib/organizations/queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Organizations" };

export default async function OrganizationsPage() {
  await requireRole("event_mgmt");
  const orgs = await listOrganizations();
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Client organizations</h1>
        <Link href="/manage/organizations/new" className="bg-brand text-white text-sm px-3 py-1.5 rounded">
          Add organization
        </Link>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="py-1">Name</th>
            <th className="py-1 text-right">Events</th>
            <th className="py-1">Last event</th>
            <th className="py-1">Alert</th>
          </tr>
        </thead>
        <tbody>
          {orgs.map((o) => (
            <tr key={o.id} className="border-t">
              <td className="py-1.5">
                <Link href={`/manage/organizations/${o.id}`} className="font-medium hover:underline">
                  {o.name}
                </Link>
              </td>
              <td className="py-1.5 text-right">{o.eventCount}</td>
              <td className="py-1.5">{o.lastEvent ? formatDate(o.lastEvent, { weekday: undefined }) : ""}</td>
              <td className="py-1.5">{o.alertFlag ? <span className="text-red-700">Alert</span> : ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
