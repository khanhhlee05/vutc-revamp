import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { eventLineItems } from "@/db/schema";
import { MessageBanner } from "@/components/events/message-banner";
import { SignupButtons } from "@/components/events/signup-buttons";
import { can, requireUser } from "@/lib/auth/session";
import { canDrop, STAFF_ROLE_LABELS } from "@/lib/events/eligibility";
import { loadSignupListing } from "@/lib/events/signup-context";
import { STATUS_LABELS } from "@/lib/events/status";
import { formatDate, formatMoney, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Event Brief" };

export default async function StaffEventPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  const user = await requireUser();
  const { id } = await props.params;
  const { msg } = await props.searchParams;
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();
  const listing = await loadSignupListing(user, eventId);
  if (!listing) notFound();
  const { event, workers, decisions } = listing;
  const lines = await db
    .select()
    .from(eventLineItems)
    .where(eq(eventLineItems.eventId, event.id))
    .orderBy(eventLineItems.id);
  const isManager = can(user, "event_mgmt");

  return (
    <div className="space-y-6 max-w-4xl">
      <MessageBanner code={msg} />
      <div className="flex flex-wrap items-baseline gap-x-4">
        <h1 className="text-3xl font-bold">
          #{event.id} {event.name}
        </h1>
        <span className="text-sm rounded bg-muted px-2 py-0.5">{STATUS_LABELS[event.status]}</span>
        {isManager ? (
          <Link href={`/manage/events/${event.id}`} className="text-sm underline ml-auto">
            Manage this event
          </Link>
        ) : null}
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded border p-4">
          <h2 className="font-semibold mb-2">Event</h2>
          <dl className="text-sm grid grid-cols-[10rem_1fr] gap-y-1">
            <dt className="text-gray-600">Organization</dt>
            <dd>{event.orgName}</dd>
            <dt className="text-gray-600">Date</dt>
            <dd>{formatDate(event.eventDate)}</dd>
            <dt className="text-gray-600">Location</dt>
            <dd>{event.location}</dd>
            <dt className="text-gray-600">Load in</dt>
            <dd>{event.loadInAt ? formatTime(event.loadInAt) : "TBD"}</dd>
            <dt className="text-gray-600">Sound check</dt>
            <dd>{event.soundcheckAt ? formatTime(event.soundcheckAt) : "None"}</dd>
            <dt className="text-gray-600">Event time</dt>
            <dd>
              {formatTime(event.startAt)} to {formatTime(event.endAt)}
            </dd>
            <dt className="text-gray-600">Reservation</dt>
            <dd>
              {formatTime(event.reservationStartAt)} to {formatTime(event.reservationEndAt)}
            </dd>
            <dt className="text-gray-600">Attendance</dt>
            <dd>{event.expectedAttendance}</dd>
            <dt className="text-gray-600">Max crew</dt>
            <dd>{event.crewSlots}</dd>
          </dl>
        </div>
        <div className="rounded border p-4">
          <h2 className="font-semibold mb-2">Client contact</h2>
          <dl className="text-sm grid grid-cols-[10rem_1fr] gap-y-1">
            <dt className="text-gray-600">Contact</dt>
            <dd>
              {event.contactName}
              <br />
              {event.contactEmail}
              <br />
              {event.contactPhone}
            </dd>
            <dt className="text-gray-600">Advisor</dt>
            <dd>
              {event.advisorName}
              <br />
              {event.advisorEmail}
            </dd>
          </dl>
        </div>
      </section>

      <section className="rounded border p-4 space-y-2">
        <h2 className="font-semibold">Needs and description</h2>
        {event.needs.length ? (
          <ul className="text-sm list-disc pl-5">
            {event.needs.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        ) : null}
        <p className="text-sm whitespace-pre-wrap">{event.description}</p>
        {event.attachmentUrl ? (
          <p className="text-sm">
            <a href={event.attachmentUrl} className="underline" rel="noopener noreferrer">
              Client attachment
            </a>
          </p>
        ) : null}
        {event.notes ? (
          <>
            <h3 className="font-medium text-sm mt-3">Staff notes</h3>
            <p className="text-sm whitespace-pre-wrap">{event.notes}</p>
          </>
        ) : null}
        {event.htNotes ? (
          <>
            <h3 className="font-medium text-sm mt-3">Head tech notes</h3>
            <p className="text-sm whitespace-pre-wrap">{event.htNotes}</p>
          </>
        ) : null}
      </section>

      {lines.length ? (
        <section className="rounded border p-4">
          <h2 className="font-semibold mb-2">Service packages</h2>
          <ul className="text-sm divide-y">
            {lines.map((l) => (
              <li key={l.id} className="py-1 flex justify-between gap-4">
                <span>
                  {Number(l.quantity) !== 1 ? `${Number(l.quantity)} × ` : ""}
                  {l.name}
                  {l.description ? <span className="text-gray-600"> · {l.description}</span> : null}
                </span>
                <span>{formatMoney(Number(l.unitPrice) * Number(l.quantity))}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="rounded border p-4 space-y-3">
        <h2 className="font-semibold">Staff</h2>
        {workers.length ? (
          <ul className="text-sm grid gap-1 sm:grid-cols-2">
            {workers.map((w, i) => (
              <li key={i}>
                <span className="text-gray-600">{STAFF_ROLE_LABELS[w.role]}:</span> {w.name}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-600">Nobody has signed up yet.</p>
        )}
        <SignupButtons
          eventId={event.id}
          decisions={decisions}
          returnTo={`/events/${event.id}`}
          allowDrop={canDrop(event)}
        />
      </section>
    </div>
  );
}
