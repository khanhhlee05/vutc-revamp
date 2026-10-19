import type { Metadata } from "next";
import Link from "next/link";
import { MessageBanner } from "@/components/events/message-banner";
import { SignupButtons } from "@/components/events/signup-buttons";
import { requireUser } from "@/lib/auth/session";
import { canDrop, STAFF_ROLE_LABELS } from "@/lib/events/eligibility";
import { loadSignupListings } from "@/lib/events/signup-context";
import { formatDate, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Sign Up for Events" };

export default async function EventsPage(props: {
  searchParams: Promise<{ msg?: string }>;
}) {
  const user = await requireUser();
  const { msg } = await props.searchParams;
  const listings = await loadSignupListings(user);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Event Opportunities</h1>
        <p className="text-sm text-gray-700">
          Signing up is a commitment. You can drop a position on the site until 24
          hours before load-in.
        </p>
      </div>
      <MessageBanner code={msg} />
      {listings.length === 0 ? (
        <p className="text-gray-600">No events are open for signup right now.</p>
      ) : (
        <ul className="space-y-4">
          {listings.map(({ event, workers, decisions, taken }) => {
            const staffCount = taken.event_staff ?? 0;
            return (
              <li key={event.id} className="rounded border p-4 space-y-3">
                <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                  <Link href={`/events/${event.id}`} className="font-semibold text-lg hover:underline">
                    #{event.id} {event.name}
                  </Link>
                  <span className="text-gray-700">{event.orgName}</span>
                  {event.status === "confirmed" ? (
                    <span className="text-xs rounded bg-amber-100 px-2 py-0.5">Pre-open: HT and senior only</span>
                  ) : null}
                  {event.isEmergency ? (
                    <span className="text-xs rounded bg-red-100 px-2 py-0.5">Emergency staffing</span>
                  ) : null}
                </div>
                <div className="text-sm text-gray-700 flex flex-wrap gap-x-6 gap-y-1">
                  <span>{formatDate(event.eventDate)}</span>
                  <span>
                    {formatTime(event.startAt)} to {formatTime(event.endAt)}
                  </span>
                  <span>Load in: {event.loadInAt ? formatTime(event.loadInAt) : "TBD"}</span>
                  <span>{event.location}</span>
                  <span>
                    Staff: {staffCount}/{event.crewSlots}
                  </span>
                </div>
                {workers.length ? (
                  <p className="text-xs text-gray-600">
                    Working:{" "}
                    {workers.map((w) => `${w.name} (${STAFF_ROLE_LABELS[w.role]})`).join(", ")}
                  </p>
                ) : null}
                <SignupButtons
                  eventId={event.id}
                  decisions={decisions}
                  returnTo="/events"
                  allowDrop={canDrop(event)}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
