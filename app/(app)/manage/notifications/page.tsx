import type { Metadata } from "next";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { Flash } from "@/components/manage/flash";
import { requireRole } from "@/lib/auth/session";
import { deleteNotification, saveNotification, toggleNotification } from "@/lib/site/actions";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Notifications" };

export default async function NotificationsPage(props: { searchParams: Promise<{ msg?: string }> }) {
  await requireRole("pers_mgmt", "event_mgmt");
  const { msg } = await props.searchParams;
  const rows = await db.select().from(notifications).orderBy(desc(notifications.createdAt));
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Notifications</h1>
      <Flash code={msg} />
      <form action={saveNotification} className="rounded border p-4 grid gap-3 md:grid-cols-2">
        <label className="text-sm md:col-span-2">
          <span className="block mb-1 font-medium">Title</span>
          <input name="title" required maxLength={200} className="w-full border rounded px-3 py-1.5" />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="block mb-1 font-medium">Body</span>
          <textarea name="body" rows={3} maxLength={5000} className="w-full border rounded px-3 py-1.5" />
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Audience</span>
          <select name="audience" className="border rounded px-3 py-1.5">
            <option value="staff">Staff dashboard and digest</option>
            <option value="client">Clients</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="block mb-1 font-medium">Priority (higher first)</span>
          <input name="priority" type="number" min={0} max={100} defaultValue={0} className="border rounded px-3 py-1.5 w-24" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="includeInDigest" defaultChecked /> Include in the daily email digest
        </label>
        <div className="md:col-span-2">
          <button type="submit" className="bg-brand text-white text-sm px-3 py-1.5 rounded">Post notification</button>
        </div>
      </form>
      <ul className="space-y-2">
        {rows.map((n) => (
          <li key={n.id} className={`rounded border p-3 text-sm flex flex-wrap gap-3 items-start ${n.isVisible ? "" : "opacity-60"}`}>
            <div className="flex-1">
              <p className="font-medium">
                {n.title} <span className="text-xs text-muted-foreground">{n.audience} · priority {n.priority} · {formatDate(n.createdAt)}</span>
              </p>
              {n.body ? <p className="whitespace-pre-wrap text-foreground/80">{n.body}</p> : null}
            </div>
            <form action={toggleNotification}>
              <input type="hidden" name="id" value={n.id} />
              <button type="submit" className="text-xs underline">{n.isVisible ? "Hide" : "Show"}</button>
            </form>
            <form action={deleteNotification}>
              <input type="hidden" name="id" value={n.id} />
              <button type="submit" className="text-xs underline text-destructive">Delete</button>
            </form>
          </li>
        ))}
      </ul>
    </div>
  );
}
