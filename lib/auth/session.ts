import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { staffProfiles, userRoles, type UserRole } from "@/db/schema";
import { auth } from "./auth";
import { hasAnyRole, hasRole } from "./roles";

export type CurrentUser = {
  id: string;
  name: string;
  email: string;
  roles: UserRole[];
  isActive: boolean;
  isApproved: boolean;
};

export class AuthorizationError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Data access layer entry point for the signed-in user. Deduplicated per
 * request with React cache. Returns null when there is no valid session.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const [profile, roleRows] = await Promise.all([
    db.query.staffProfiles.findFirst({
      where: eq(staffProfiles.userId, session.user.id),
    }),
    db
      .select({ role: userRoles.role })
      .from(userRoles)
      .where(eq(userRoles.userId, session.user.id)),
  ]);

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    roles: roleRows.map((r) => r.role),
    isActive: profile?.isActive ?? false,
    isApproved: profile?.isApproved ?? false,
  };
});

/** For pages: redirect to login when signed out. */
export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** For pages: redirect when the user lacks the role. */
export async function requireRole(
  ...roles: UserRole[]
): Promise<CurrentUser> {
  const user = await requireUser();
  if (!hasAnyRole(user.roles, roles)) redirect("/forbidden");
  return user;
}

/** For server actions: throw instead of redirect so the caller can report. */
export async function assertUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthorizationError("Sign in required");
  return user;
}

export async function assertRole(...roles: UserRole[]): Promise<CurrentUser> {
  const user = await assertUser();
  if (!hasAnyRole(user.roles, roles)) throw new AuthorizationError();
  return user;
}

export function can(user: CurrentUser, role: UserRole): boolean {
  return hasRole(user.roles, role);
}
