import { LinkTabs } from "@/components/ui/tabs";

export function EventTabs({ id, active }: { id: number; active: "overview" | "edit" | "packages" | "staff" | "timesheet" | "bill" }) {
  const tabs = [
    { key: "overview", href: `/manage/events/${id}`, label: "Overview" },
    { key: "edit", href: `/manage/events/${id}/edit`, label: "Details" },
    { key: "packages", href: `/manage/events/${id}/packages`, label: "Packages and quote" },
    { key: "staff", href: `/manage/events/${id}/staff`, label: "Staffing" },
    { key: "timesheet", href: `/events/${id}/timesheet`, label: "Timesheet" },
    { key: "bill", href: `/manage/events/${id}/bill`, label: "Invoice" },
  ] as const;
  return <LinkTabs tabs={tabs} active={active} />;
}
