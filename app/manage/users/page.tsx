import type { Metadata } from "next";
import Link from "next/link";
import { requireRole } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { listUsers } from "@/lib/users/queries";

export const metadata: Metadata = { title: "Personnel" };

export default async function UsersPage(props: { searchParams: Promise<{ show?: string }> }) {
  await requireRole("pers_mgmt");
  const { show } = await props.searchParams;
  const all = await listUsers();
  const rows = show === "all" ? all : all.filter((u) => u.isActive !== false);
  const pending = all.filter((u) => u.isApproved === false);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">Personnel</h1>
        <Link href="/manage/users/new" className="bg-brand text-white text-sm px-3 py-1.5 rounded">
          Add member
        </Link>
        <span className="text-sm text-gray-600 ml-auto">
          {show === "all" ? (
            <Link href="/manage/users" className="underline">Hide inactive</Link>
          ) : (
            <Link href="/manage/users?show=all" className="underline">Show inactive</Link>
          )}
        </span>
      </div>
      {pending.length ? (
        <p className="text-sm rounded border border-amber-300 bg-amber-50 p-3">
          {pending.length} account{pending.length === 1 ? "" : "s"} awaiting approval.
        </p>
      ) : null}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-600">
            <th className="py-1">Name</th>
            <th className="py-1">Email</th>
            <th className="py-1">Class</th>
            <th className="py-1">Roles</th>
            <th className="py-1">Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.id} className="border-t">
              <td className="py-1.5">
                <Link href={`/manage/users/${u.id}`} className="font-medium hover:underline">
                  {u.name}
                </Link>
              </td>
              <td className="py-1.5">{u.email}</td>
              <td className="py-1.5">{u.gradYear ?? ""}</td>
              <td className="py-1.5 text-gray-700">{u.roles.map((r) => ROLE_LABELS[r]).join(", ")}</td>
              <td className="py-1.5">
                {u.isApproved === false ? (
                  <span className="text-amber-700">Pending approval</span>
                ) : u.isActive === false ? (
                  <span className="text-gray-500">Inactive</span>
                ) : (
                  "Active"
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
