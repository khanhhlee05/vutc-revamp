"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { events } from "@/db/schema";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send";
import { env } from "@/lib/env";

/** Client accepts the quote from the public brief page. */
export async function confirmQuote(token: string): Promise<void> {
  if (!/^[A-Za-z0-9_-]{32,64}$/.test(token)) return;
  const [updated] = await db
    .update(events)
    .set({ isConfirmed: true, updatedAt: new Date() })
    .where(
      and(
        eq(events.publicToken, token),
        eq(events.isConfirmed, false),
        eq(events.status, "confirmed"),
      ),
    )
    .returning({
      id: events.id,
      name: events.name,
      orgName: events.orgName,
      contactEmail: events.contactEmail,
    });
  if (!updated) return;

  await audit({
    action: "event.client_confirmed",
    entityType: "event",
    entityId: updated.id,
    detail: `${updated.orgName}: ${updated.name} confirmed by ${updated.contactEmail}`,
  });
  try {
    await sendEmail({
      to: env.EVENTS_INBOX,
      subject: `Quote confirmed #${updated.id}: ${updated.orgName} - ${updated.name}`,
      text: `${updated.contactEmail} confirmed the quote for event #${updated.id}.\n${env.NEXT_PUBLIC_APP_URL}/manage/events/${updated.id}`,
    });
  } catch (err) {
    console.error("confirmation email failed", err);
  }
  revalidatePath(`/brief/${token}`);
}
