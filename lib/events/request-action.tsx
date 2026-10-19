"use server";

import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { render } from "@react-email/render";
import { db } from "@/db";
import { events } from "@/db/schema";
import { audit } from "@/lib/audit";
import { sendEmail } from "@/lib/email/send";
import {
  RequestSubmittedClientEmail,
  RequestSubmittedStaffEmail,
  requestEmailText,
  type RequestEmailData,
} from "@/lib/email/templates/request-submitted";
import { env } from "@/lib/env";
import { formatDate, formatDateTime, formatPhone, formatTime } from "@/lib/format";
import { AttachmentError, storeAttachment } from "@/lib/storage";
import { zonedToUtc } from "@/lib/time";
import { verifyTurnstile } from "@/lib/turnstile";
import {
  eventRequestFromFormData,
  eventRequestSchema,
  fieldErrorsFromZod,
  type FieldErrors,
} from "@/lib/validation/request";

export type RequestFormState = {
  errors?: FieldErrors;
  formError?: string;
  values?: Record<string, string | string[] | boolean>;
};

function valuesFromForm(form: FormData): RequestFormState["values"] {
  const out: Record<string, string | string[] | boolean> = {};
  for (const [k, v] of form.entries()) {
    if (k === "needs") {
      out.needs = form.getAll("needs").map(String);
    } else if (typeof v === "string") {
      out[k] = v;
    }
  }
  return out;
}

export async function submitEventRequest(
  _prev: RequestFormState,
  form: FormData,
): Promise<RequestFormState> {
  const values = valuesFromForm(form);
  const parsed = eventRequestSchema.safeParse(eventRequestFromFormData(form));
  if (!parsed.success) {
    return { errors: fieldErrorsFromZod(parsed.error), values };
  }
  const input = parsed.data;

  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const human = await verifyTurnstile(
    form.get("cf-turnstile-response")?.toString(),
    ip,
  );
  if (!human) {
    return {
      formError: "We could not verify that you are human. Please try again.",
      values,
    };
  }

  let attachmentUrl: string | null = null;
  try {
    const file = form.get("attachment");
    attachmentUrl = await storeAttachment(file instanceof File ? file : null);
  } catch (err) {
    if (err instanceof AttachmentError) {
      return { formError: err.message, values };
    }
    throw err;
  }

  const publicToken = randomBytes(32).toString("base64url");
  const startAt = zonedToUtc(input.eventDate, input.startTime);
  const endAt = zonedToUtc(input.eventDate, input.endTime);
  const soundcheckAt = input.soundcheckTime
    ? zonedToUtc(input.eventDate, input.soundcheckTime)
    : null;

  const [created] = await db
    .insert(events)
    .values({
      publicToken,
      status: "requested",
      name: input.name,
      orgName: input.orgName,
      contactName: input.contactName,
      contactEmail: input.contactEmail.toLowerCase(),
      contactPhone: formatPhone(input.contactPhone),
      advisorName: input.advisorName,
      advisorEmail: input.advisorEmail.toLowerCase(),
      accountIndex: input.accountIndex,
      isStudentOrg: input.isStudentOrg,
      location: input.location,
      eventDate: input.eventDate,
      startAt,
      endAt,
      soundcheckAt,
      reservationStartAt: zonedToUtc(input.eventDate, input.reservationStart),
      reservationEndAt: zonedToUtc(input.eventDate, input.reservationEnd),
      expectedAttendance: input.expectedAttendance,
      needs: input.needs,
      description: input.description,
      attachmentUrl,
    })
    .returning({ id: events.id, submittedAt: events.submittedAt });

  await audit({
    action: "event.requested",
    entityType: "event",
    entityId: created.id,
    detail: `${input.orgName}: ${input.name}`,
  });

  const data: RequestEmailData = {
    eventId: created.id,
    eventName: input.name,
    orgName: input.orgName,
    contactName: input.contactName,
    contactEmail: input.contactEmail,
    contactPhone: formatPhone(input.contactPhone),
    advisorName: input.advisorName,
    advisorEmail: input.advisorEmail,
    accountIndex: input.accountIndex,
    location: input.location,
    eventDate: formatDate(input.eventDate),
    startTime: formatTime(startAt),
    endTime: formatTime(endAt),
    soundcheckTime: soundcheckAt ? formatTime(soundcheckAt) : "",
    reservationStart: formatTime(zonedToUtc(input.eventDate, input.reservationStart)),
    reservationEnd: formatTime(zonedToUtc(input.eventDate, input.reservationEnd)),
    expectedAttendance: input.expectedAttendance,
    needs: input.needs,
    description: input.description,
    submittedAt: formatDateTime(created.submittedAt),
    briefUrl: `${env.NEXT_PUBLIC_APP_URL}/brief/${publicToken}`,
    manageUrl: `${env.NEXT_PUBLIC_APP_URL}/manage/events/${created.id}`,
  };

  try {
    await Promise.all([
      sendEmail({
        to: [input.contactEmail, input.advisorEmail],
        subject: `VUTC Event Request #${created.id}: ${input.name}`,
        text: `Thank you for your request. View its status: ${data.briefUrl}\n\n${requestEmailText(data)}`,
        html: await render(<RequestSubmittedClientEmail data={data} />),
      }),
      sendEmail({
        to: env.EVENTS_INBOX,
        replyTo: input.contactEmail,
        subject: `New event request #${created.id}: ${input.orgName} - ${input.name}`,
        text: `${data.manageUrl}\n\n${requestEmailText(data)}`,
        html: await render(<RequestSubmittedStaffEmail data={data} />),
      }),
    ]);
  } catch (err) {
    // The request is saved; email failure must not look like a failed submission.
    console.error("request emails failed", err);
  }

  redirect(`/brief/${publicToken}?submitted=1`);
}
