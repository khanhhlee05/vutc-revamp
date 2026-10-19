import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { boardPositions, user } from "@/db/schema";
import { Flash } from "@/components/manage/flash";
import { requireRole } from "@/lib/auth/session";
import { deleteBoardPosition, saveBoardPosition } from "@/lib/site/actions";
import { listStaffForPicker } from "@/lib/events/manage-queries";

export const metadata: Metadata = { title: "Executive Board" };

const input = "border rounded px-2 py-1 text-sm";

function Row({
  pos,
  staff,
}: {
  pos?: typeof boardPositions.$inferSelect;
  staff: { id: string; name: string }[];
}) {
  return (
    <form action={saveBoardPosition} className="grid gap-2 md:grid-cols-[1fr_1.5fr_1fr_1fr_1fr_4rem_auto] items-end rounded border p-3">
      <input type="hidden" name="id" value={pos?.id ?? 0} />
      <label className="text-xs">Title<input name="title" required defaultValue={pos?.title ?? ""} className={`${input} w-full`} /></label>
      <label className="text-xs">Contact them about<input name="contactAbout" defaultValue={pos?.contactAbout ?? ""} className={`${input} w-full`} /></label>
      <label className="text-xs">Staff member
        <select name="userId" defaultValue={pos?.userId ?? ""} className={`${input} w-full`}>
          <option value="">(none)</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </label>
      <label className="text-xs">Or display name<input name="displayName" defaultValue={pos?.displayName ?? ""} className={`${input} w-full`} /></label>
      <label className="text-xs">Display email<input name="displayEmail" type="email" defaultValue={pos?.displayEmail ?? ""} className={`${input} w-full`} /></label>
      <label className="text-xs">Order<input name="sortOrder" type="number" defaultValue={pos?.sortOrder ?? 0} className={`${input} w-full`} /></label>
      <div className="flex items-center gap-2">
        <label className="text-xs flex items-center gap-1"><input type="checkbox" name="isVisible" defaultChecked={pos?.isVisible ?? true} />Show</label>
        <button type="submit" className="bg-brand text-white text-xs px-2 py-1 rounded">{pos ? "Save" : "Add"}</button>
      </div>
    </form>
  );
}

export default async function BoardPage(props: { searchParams: Promise<{ msg?: string }> }) {
  await requireRole("pers_mgmt");
  const { msg } = await props.searchParams;
  const [rows, staff] = await Promise.all([
    db
      .select({ pos: boardPositions, userName: user.name })
      .from(boardPositions)
      .leftJoin(user, eq(user.id, boardPositions.userId))
      .orderBy(asc(boardPositions.sortOrder), asc(boardPositions.id)),
    listStaffForPicker(),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Executive board (About page)</h1>
      <Flash code={msg} />
      {rows.map(({ pos }) => (
        <div key={pos.id} className="space-y-1">
          <Row pos={pos} staff={staff} />
          <form action={deleteBoardPosition} className="text-right">
            <input type="hidden" name="id" value={pos.id} />
            <button type="submit" className="text-xs underline text-red-700">Delete {pos.title}</button>
          </form>
        </div>
      ))}
      <h2 className="font-semibold pt-4">Add a position</h2>
      <Row staff={staff} />
    </div>
  );
}
