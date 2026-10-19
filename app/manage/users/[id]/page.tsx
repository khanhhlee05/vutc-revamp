import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { resendInvite, updateUserAdmin } from "@/lib/users/actions";
import { getUserForAdmin } from "@/lib/users/queries";
import { formatDate } from "@/lib/format";
import { UserForm } from "../user-form";

export const metadata: Metadata = { title: "Edit Member" };

export default async function EditUserPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; resent?: string }>;
}) {
  await requireRole("pers_mgmt");
  const { id } = await props.params;
  const { created, resent } = await props.searchParams;
  const u = await getUserForAdmin(id);
  if (!u) notFound();
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">{u.name}</h1>
        <p className="text-sm text-gray-600">
          Member since {formatDate(u.createdAt)} ·{" "}
          {u.hasPassword ? "Password set" : "Has not set a password yet"}
        </p>
      </div>
      {created ? (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm">Account created and invite sent.</p>
      ) : null}
      {resent ? (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm">Invite re-sent.</p>
      ) : null}
      <UserForm
        action={updateUserAdmin}
        mode="edit"
        initial={{
          id: u.id,
          name: u.name,
          email: u.email,
          roles: u.roles.map((r) => r.role),
          isApproved: u.profile?.isApproved ?? false,
          isActive: u.profile?.isActive ?? true,
          notes: u.profile?.notes ?? "",
          phone: u.profile?.phone ?? "",
          gradYear: u.profile?.gradYear ? String(u.profile.gradYear) : "",
          bannerId: u.profile?.bannerId ?? "",
          residence: u.profile?.residence ?? "",
          emergencyContact: u.profile?.emergencyContact ?? "",
          emergencyPhone: u.profile?.emergencyPhone ?? "",
          receivesNotifications: u.profile?.receivesNotifications ?? true,
        }}
      />
      <form action={resendInvite} className="border-t pt-4">
        <input type="hidden" name="id" value={u.id} />
        <button type="submit" className="text-sm underline">
          Re-send set-password link
        </button>
      </form>
    </div>
  );
}
