import Link from "next/link";

export function EventTabs({ id, active }: { id: number; active: "overview" | "edit" | "packages" | "staff" }) {
  const tabs = [
    { key: "overview", href: `/manage/events/${id}`, label: "Overview" },
    { key: "edit", href: `/manage/events/${id}/edit`, label: "Details" },
    { key: "packages", href: `/manage/events/${id}/packages`, label: "Packages and quote" },
    { key: "staff", href: `/manage/events/${id}/staff`, label: "Staffing" },
  ] as const;
  return (
    <nav className="flex gap-4 border-b text-sm">
      {tabs.map((t) => (
        <Link
          key={t.key}
          href={t.href}
          className={`pb-2 -mb-px border-b-2 ${active === t.key ? "border-brand font-medium" : "border-transparent hover:border-gray-300"}`}
        >
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
