import { cookies } from "next/headers";
import { AppShell, SIDEBAR_COOKIE } from "@/components/shell/app-shell";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { can, requireUser } from "@/lib/auth/session";
import { countEventsByStatus } from "@/lib/events/manage-queries";
import { appNav } from "@/lib/nav";

/** Signed-in workspace: staff pages and /manage. Pages still check roles themselves. */
export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [counts, cookieStore] = await Promise.all([
    can(user, "event_mgmt") ? countEventsByStatus() : null,
    cookies(),
  ]);
  const nav = appNav(user.roles, { newRequests: counts?.requested });
  const roleLabel = user.roles.length ? ROLE_LABELS[user.roles[0]] : "Staff member";

  return (
    <AppShell
      nav={nav}
      user={{ name: user.name, email: user.email, roleLabel }}
      defaultCollapsed={cookieStore.get(SIDEBAR_COOKIE)?.value === "1"}
    >
      {children}
    </AppShell>
  );
}
