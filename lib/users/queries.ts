import "server-only";
import { asc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { staffProfiles, user, userRoles, type UserRole } from "@/db/schema";

export async function listUsers() {
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      gradYear: staffProfiles.gradYear,
      isActive: staffProfiles.isActive,
      isApproved: staffProfiles.isApproved,
      roles: sql<string[]>`coalesce(array_agg(${userRoles.role}) filter (where ${userRoles.role} is not null), '{}')`,
    })
    .from(user)
    .leftJoin(staffProfiles, eq(staffProfiles.userId, user.id))
    .leftJoin(userRoles, eq(userRoles.userId, user.id))
    .groupBy(user.id, staffProfiles.gradYear, staffProfiles.isActive, staffProfiles.isApproved)
    .orderBy(asc(user.name));
  return rows.map((r) => ({ ...r, roles: r.roles as UserRole[] }));
}

export async function getUserForAdmin(id: string) {
  const u = await db.query.user.findFirst({
    where: eq(user.id, id),
    with: { profile: true, roles: true },
  });
  if (!u) return null;
  const hasPassword = await db.query.account.findFirst({
    where: (a, { and, eq }) => and(eq(a.userId, id), eq(a.providerId, "credential")),
    columns: { password: true },
  });
  return { ...u, hasPassword: Boolean(hasPassword?.password) };
}
