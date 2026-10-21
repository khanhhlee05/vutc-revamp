import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staffProfiles } from "@/db/schema";
import { requireUser } from "@/lib/auth/session";
import { ChangePasswordForm } from "./change-password-form";
import { ProfileForm } from "./profile-form";

export const metadata: Metadata = { title: "My Account" };

export default async function AccountPage() {
  const user = await requireUser();
  const profile = await db.query.staffProfiles.findFirst({
    where: eq(staffProfiles.userId, user.id),
  });
  return (
    <div className="space-y-10 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold">My Account</h1>
        <p className="text-sm text-foreground/80">
          {user.name} · {user.email}. Ask personnel management to change your name or email.
        </p>
      </div>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Profile</h2>
        <ProfileForm
          initial={{
            phone: profile?.phone ?? "",
            gradYear: profile?.gradYear ? String(profile.gradYear) : "",
            bannerId: profile?.bannerId ?? "",
            residence: profile?.residence ?? "",
            emergencyContact: profile?.emergencyContact ?? "",
            emergencyPhone: profile?.emergencyPhone ?? "",
            receivesNotifications: profile?.receivesNotifications ?? true,
          }}
        />
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}
