import { redirect } from "next/navigation";
import { can, requireUser } from "@/lib/auth/session";

export default async function ManageIndex() {
  const user = await requireUser();
  if (can(user, "event_mgmt")) redirect("/manage/events");
  if (can(user, "pers_mgmt")) redirect("/manage/users");
  if (can(user, "bus_mgmt")) redirect("/manage/payroll");
  redirect("/forbidden");
}
