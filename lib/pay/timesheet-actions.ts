"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { eventAssignments, events } from "@/db/schema";
import { audit } from "@/lib/audit";
import { assertUser } from "@/lib/auth/session";
import { lineTotal } from "@/lib/events/pricing";
import { computePaySplit, type SplitWorker } from "./split";
import { canSubmitTimesheet, getTimesheetEvent, TIMESHEET_STATUSES } from "./queries";

function tenths(value: FormDataEntryValue | null): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(10, Math.max(0, Math.round(n))) / 10;
}

/** Saves run/load fractions, computes pay for every assignment, and completes the event. */
export async function submitTimesheet(form: FormData): Promise<void> {
  const viewer = await assertUser();
  const id = Number(form.get("eventId"));
  if (!Number.isInteger(id)) throw new Error("Invalid event");
  const event = await getTimesheetEvent(id);
  if (!event) throw new Error("Event not found");
  if (!canSubmitTimesheet(viewer, event)) redirect("/forbidden");
  if (!TIMESHEET_STATUSES.includes(event.status)) redirect(`/events/${id}/timesheet?msg=locked`);

  const workers: SplitWorker[] = event.assignments.map((a) => ({
    id: a.id,
    role: a.role,
    run: tenths(form.get(`run-${a.id}`)),
    load: tenths(form.get(`load-${a.id}`)),
  }));
  const result = computePaySplit({
    lines: event.lineItems.map((l) => ({
      amount: lineTotal(l.unitPrice, l.quantity),
      routing: l.package?.payRouting ?? "standard",
    })),
    customTotal: event.customQuoteItems.reduce((s, c) => s + Number(c.price), 0),
    discount: Number(event.discount),
    workers,
  });
  const htNotes = String(form.get("htNotes") ?? "").trim().slice(0, 5000);

  await db.transaction(async (tx) => {
    for (const w of workers) {
      await tx
        .update(eventAssignments)
        .set({
          runFraction: w.run.toFixed(2),
          loadFraction: w.load.toFixed(2),
          pay: (result.pay.get(w.id) ?? 0).toFixed(2),
          hasDeduction: form.get(`deduction-${w.id}`) === "on",
          notes: String(form.get(`note-${w.id}`) ?? "").trim().slice(0, 1000),
        })
        .where(eq(eventAssignments.id, w.id));
    }
    await tx
      .update(events)
      .set({ status: "completed", vutcShare: result.vutcShare.toFixed(2), htNotes, updatedAt: new Date() })
      .where(eq(events.id, id));
  });
  await audit({
    action: "event.timesheet",
    userId: viewer.id,
    entityType: "event",
    entityId: id,
    detail: `VUTC share ${result.vutcShare.toFixed(2)}${result.warnings.length ? `; ${result.warnings.join(" ")}` : ""}`,
  });
  revalidatePath(`/manage/events/${id}`);
  revalidatePath(`/events/${id}/timesheet`);
  revalidatePath(`/events/${id}`);
  revalidatePath("/manage/events");
  revalidatePath("/dashboard");
  revalidatePath("/my-events");
  redirect(`/events/${id}/timesheet?msg=saved`);
}
