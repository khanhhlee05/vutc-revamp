import type { UserRole } from "@/db/schema";

/** Roles that imply full access to every management area. */
export const ADMIN_ROLES: readonly UserRole[] = ["exec"];

/** Human-readable labels for permission roles. */
export const ROLE_LABELS: Record<UserRole, string> = {
  exec: "Executive Board",
  vpep: "VP of Event Production",
  vpf: "VP of Finance",
  event_mgmt: "Event Management",
  bus_mgmt: "Business Management",
  pers_mgmt: "Personnel Management",
  senior: "Senior Staff",
  aht: "Audio Head Tech",
  lht: "Lighting Head Tech",
  vht: "Video Head Tech",
  dj: "DJ",
};

/**
 * Returns true when a user holding `held` may act as `required`.
 * `exec` satisfies everything. `vpep` implies event management and
 * `vpf` implies business management, matching how the legacy menu treated
 * those officers.
 */
export function hasRole(held: readonly UserRole[], required: UserRole): boolean {
  if (held.includes(required)) return true;
  if (held.some((r) => ADMIN_ROLES.includes(r))) return true;
  if (required === "event_mgmt" && held.includes("vpep")) return true;
  if (required === "bus_mgmt" && held.includes("vpf")) return true;
  return false;
}

export function hasAnyRole(
  held: readonly UserRole[],
  required: readonly UserRole[],
): boolean {
  return required.some((r) => hasRole(held, r));
}
