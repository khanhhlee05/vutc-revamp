import Link from "next/link";
import { can, requireUser } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const areas = [
    { href: "/manage/events", label: "Events", ok: can(user, "event_mgmt") },
    { href: "/manage/users", label: "Personnel", ok: can(user, "pers_mgmt") },
    { href: "/manage/payroll", label: "Business", ok: can(user, "bus_mgmt") },
  ].filter((a) => a.ok);
  if (areas.length === 0) redirect("/forbidden");
  return (
    <div className="space-y-6">
      <nav className="flex gap-4 border-b pb-2 text-sm">
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
