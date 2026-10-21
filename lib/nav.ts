import type { UserRole } from "@/db/schema";
import { hasRole } from "@/lib/auth/roles";

/**
 * Navigation for the public site and the signed-in workspace. The sidebar only
 * hides links a user cannot use; every page and action still checks the role
 * on the server, so this is never the thing that protects a page.
 */

export type NavIcon =
  | "overview"
  | "shifts"
  | "my-events"
  | "leaderboard"
  | "events"
  | "organizations"
  | "personnel"
  | "notifications"
  | "board"
  | "payroll"
  | "billing";

export type NavItem = { href: string; label: string; icon: NavIcon; badge?: number };
export type NavGroup = { label: string; items: NavItem[] };

export const SITE_LINKS = [
  { href: "/about", label: "About" },
  { href: "/calendar", label: "Calendar" },
  { href: "/faqs", label: "FAQs" },
  { href: "/policies", label: "Policies" },
] as const;

export function appNav(roles: readonly UserRole[], counts: { newRequests?: number } = {}): NavGroup[] {
  const eventMgmt = hasRole(roles, "event_mgmt");
  const persMgmt = hasRole(roles, "pers_mgmt");
  const busMgmt = hasRole(roles, "bus_mgmt");

  const groups: NavGroup[] = [
    {
      label: "Workspace",
      items: [
        { href: "/dashboard", label: "Overview", icon: "overview" },
        { href: "/events", label: "Available shifts", icon: "shifts" },
        { href: "/my-events", label: "My events", icon: "my-events" },
        { href: "/leaderboard", label: "Leaderboard", icon: "leaderboard" },
      ],
    },
  ];

  const operations: NavItem[] = [];
  if (eventMgmt) {
    operations.push(
      { href: "/manage/events", label: "Events", icon: "events", badge: counts.newRequests || undefined },
      { href: "/manage/organizations", label: "Organizations", icon: "organizations" },
    );
  }
  if (persMgmt || eventMgmt) operations.push({ href: "/manage/notifications", label: "Notifications", icon: "notifications" });
  if (operations.length) groups.push({ label: "Operations", items: operations });

  if (persMgmt) {
    groups.push({
      label: "People",
      items: [
        { href: "/manage/users", label: "Personnel", icon: "personnel" },
        { href: "/manage/board", label: "Board", icon: "board" },
      ],
    });
  }

  if (busMgmt) {
    groups.push({
      label: "Finance",
      items: [
        { href: "/manage/payroll", label: "Payroll", icon: "payroll" },
        { href: "/manage/billing", label: "Billing", icon: "billing" },
      ],
    });
  }

  return groups;
}

/** The href that best matches the current path, so nested pages light up their parent. */
export function activeHref(pathname: string, hrefs: readonly string[]): string | undefined {
  let best: string | undefined;
  for (const href of hrefs) {
    const match = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
    if (match && (!best || href.length > best.length)) best = href;
  }
  return best;
}
