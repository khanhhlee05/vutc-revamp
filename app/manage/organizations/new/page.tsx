import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/session";
import { createOrganization } from "@/lib/organizations/actions";
import { OrgForm } from "../org-form";

export const metadata: Metadata = { title: "New Organization" };

export default async function NewOrganizationPage() {
  await requireRole("event_mgmt");
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">New organization</h1>
      <OrgForm action={createOrganization} initial={{ name: "", description: "", alertFlag: false }} />
    </div>
  );
}
