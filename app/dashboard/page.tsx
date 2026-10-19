import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/roles";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
      <p className="text-sm text-gray-700">
        Roles:{" "}
        {user.roles.length
          ? user.roles.map((r) => ROLE_LABELS[r]).join(", ")
          : "Staff Member"}
      </p>
      {!user.isApproved ? (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          Your account is awaiting approval from personnel management.
        </p>
      ) : null}
    </div>
  );
}
