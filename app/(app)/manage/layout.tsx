import { redirect } from "next/navigation";
import { can, requireUser } from "@/lib/auth/session";

/** Gate for every management page. Navigation lives in the sidebar. */
export default async function ManageLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  if (!can(user, "event_mgmt") && !can(user, "pers_mgmt") && !can(user, "bus_mgmt")) redirect("/forbidden");
  return children;
}
