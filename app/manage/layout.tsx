import Link from "next/link";
import { redirect } from "next/navigation";
import { can, requireUser } from "@/lib/auth/session";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const eventMgmt = can(user, "event_mgmt");
  const persMgmt = can(user, "pers_mgmt");
  const busMgmt = can(user, "bus_mgmt");
  const areas = [
    { href: "/manage/events", label: "Events", ok: eventMgmt },
    { href: "/manage/organizations", label: "Organizations", ok: eventMgmt },
    { href: "/manage/users", label: "Personnel", ok: persMgmt },
    { href: "/manage/notifications", label: "Notifications", ok: persMgmt || eventMgmt },
    { href: "/manage/board", label: "Board", ok: persMgmt },
    { href: "/manage/payroll", label: "Business", ok: busMgmt },
  ].filter((a) => a.ok);
  if (areas.length === 0) redirect("/forbidden");
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-4 border-b pb-2 text-sm">
        {areas.map((a) => (
          <Link key={a.href} href={a.href} className="hover:underline">
            {a.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
