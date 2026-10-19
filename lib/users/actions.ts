"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { session, staffProfiles, user, userRoles, type UserRole } from "@/db/schema";
import { audit } from "@/lib/audit";
import { auth } from "@/lib/auth/auth";
import { assertRole, assertUser } from "@/lib/auth/session";
import { env } from "@/lib/env";
import { formatPhone } from "@/lib/format";
import {
  firstErrors,
  inviteUserSchema,
  profileFromForm,
  profileSchema,
  updateUserSchema,
  userFromForm,
  type ProfileInput,
} from "@/lib/validation/user";

export type ProfileFormState = { errors?: Record<string, string>; saved?: boolean };
export type UserFormState = {
  errors?: Record<string, string>;
  formError?: string;
  saved?: boolean;
  values?: Record<string, string | string[] | boolean>;
};

function profileValues(input: ProfileInput) {
  return {
    phone: input.phone ? formatPhone(input.phone) : null,
    gradYear: input.gradYear ?? null,
    bannerId: input.bannerId || null,
    residence: input.residence || null,
    emergencyContact: input.emergencyContact || null,
    emergencyPhone: input.emergencyPhone ? formatPhone(input.emergencyPhone) : null,
    receivesNotifications: input.receivesNotifications,
    updatedAt: new Date(),
  };
}

function rawValues(form: FormData) {
  const out: Record<string, string | string[] | boolean> = {};
  for (const [k, v] of form.entries()) {
    if (k === "roles") out.roles = form.getAll("roles").map(String);
    else if (typeof v === "string") out[k] = v;
  }
  return out;
}

/** Staff member edits their own profile. */
export async function updateMyProfile(
  _prev: ProfileFormState,
  form: FormData,
): Promise<ProfileFormState> {
  const me = await assertUser();
  const parsed = profileSchema.safeParse(profileFromForm(form));
  if (!parsed.success) return { errors: firstErrors(parsed.error) };
  await db
    .insert(staffProfiles)
    .values({ userId: me.id, ...profileValues(parsed.data) })
    .onConflictDoUpdate({ target: staffProfiles.userId, set: profileValues(parsed.data) });
  await audit({ action: "user.profile_updated", userId: me.id, entityType: "user", entityId: me.id });
  revalidatePath("/account");
  return { saved: true };
}

async function sendInvite(email: string) {
  await auth.api.requestPasswordReset({
    body: { email, redirectTo: `${env.NEXT_PUBLIC_APP_URL}/reset-password?invite=1` },
  });
}

/** Personnel management creates an account and emails an invite link. */
export async function inviteUser(_prev: UserFormState, form: FormData): Promise<UserFormState> {
  const admin = await assertRole("pers_mgmt");
  const values = rawValues(form);
  const parsed = inviteUserSchema.safeParse(userFromForm(form));
  if (!parsed.success) return { errors: firstErrors(parsed.error), values };
  const input = parsed.data;
  const email = input.email.toLowerCase();

  const existing = await db.query.user.findFirst({ where: eq(user.email, email) });
  if (existing) return { errors: { email: "An account with this email already exists" }, values };

  const ctx = await auth.$context;
  const created = await ctx.internalAdapter.createUser(
    { email, name: input.name, emailVerified: false },
    { method: "admin" },
  );
  await db.insert(staffProfiles).values({
    userId: created.id,
    isApproved: input.isApproved,
    isActive: true,
    ...profileValues(input),
  });
  if (input.roles.length) {
    await db.insert(userRoles).values(
      input.roles.map((role) => ({ userId: created.id, role, grantedById: admin.id })),
    );
  }
  await audit({
    action: "user.invited",
    userId: admin.id,
    entityType: "user",
    entityId: created.id,
    detail: `${input.name} <${email}> roles=${input.roles.join(",") || "none"}`,
  });
  try {
    await sendInvite(email);
  } catch (err) {
    console.error("invite email failed", err);
    return { formError: "Account created, but the invite email failed. Use Resend invite on the user page.", values };
  }
  revalidatePath("/manage/users");
  redirect(`/manage/users/${created.id}?created=1`);
}

/** Personnel management edits name, email, roles, status, and profile. */
export async function updateUserAdmin(
  _prev: UserFormState,
  form: FormData,
): Promise<UserFormState> {
  const admin = await assertRole("pers_mgmt");
  const id = String(form.get("id") ?? "");
  const values = rawValues(form);
  const parsed = updateUserSchema.safeParse(userFromForm(form));
  if (!parsed.success) return { errors: firstErrors(parsed.error), values };
  const input = parsed.data;
  const email = input.email.toLowerCase();

  const target = await db.query.user.findFirst({ where: eq(user.id, id) });
  if (!target) return { formError: "User not found", values };
  const clash = await db.query.user.findFirst({ where: and(eq(user.email, email), ne(user.id, id)) });
  if (clash) return { errors: { email: "Another account uses this email" }, values };

  // Admins cannot strip their own exec role or deactivate themselves.
  const isSelf = id === admin.id;
  const roles = new Set<UserRole>(input.roles);
  if (isSelf && admin.roles.includes("exec")) roles.add("exec");
  const isActive = isSelf ? true : input.isActive;

  await db.transaction(async (tx) => {
    await tx.update(user).set({ name: input.name, email, updatedAt: new Date() }).where(eq(user.id, id));
    await tx
      .insert(staffProfiles)
      .values({ userId: id, isActive, isApproved: input.isApproved, notes: input.notes, ...profileValues(input) })
      .onConflictDoUpdate({
        target: staffProfiles.userId,
        set: { isActive, isApproved: input.isApproved, notes: input.notes, ...profileValues(input) },
      });
    await tx.delete(userRoles).where(eq(userRoles.userId, id));
    if (roles.size) {
      await tx.insert(userRoles).values([...roles].map((role) => ({ userId: id, role, grantedById: admin.id })));
    }
  });
  if (!isActive) {
    // Sign the deactivated member out everywhere.
    await db.delete(session).where(eq(session.userId, id));
  }
  await audit({
    action: "user.updated",
    userId: admin.id,
    entityType: "user",
    entityId: id,
    detail: `roles=${[...roles].join(",") || "none"} active=${isActive} approved=${input.isApproved}`,
  });
  revalidatePath("/manage/users");
  revalidatePath(`/manage/users/${id}`);
  return { saved: true };
}

/** Re-send the set-password link. */
export async function resendInvite(form: FormData): Promise<void> {
  const admin = await assertRole("pers_mgmt");
  const id = String(form.get("id") ?? "");
  const target = await db.query.user.findFirst({ where: eq(user.id, id) });
  if (!target) return;
  await sendInvite(target.email);
  await audit({ action: "user.invite_resent", userId: admin.id, entityType: "user", entityId: id });
  redirect(`/manage/users/${id}?resent=1`);
}
