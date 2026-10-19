import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { inviteUser } from "@/lib/users/actions";
import { UserForm } from "../user-form";

export const metadata: Metadata = { title: "Add Member" };

export default async function NewUserPage() {
  await requireRole("pers_mgmt");
  return (
    <div className="space-y-4 max-w-3xl">
      <h1 className="text-2xl font-bold">Add a staff member</h1>
      <p className="text-sm text-gray-700">
        The member gets an email with a link to set their password. Leave Approved unchecked for
        prospective staff who have not finished training.
      </p>
      <UserForm
        action={inviteUser}
        mode="create"
        initial={{
          name: "",
          email: "",
          roles: [],
          isApproved: true,
          isActive: true,
          notes: "",
          phone: "",
          gradYear: "",
          bannerId: "",
          residence: "",
          emergencyContact: "",
          emergencyPhone: "",
          receivesNotifications: true,
        }}
      />
    </div>
  );
}
