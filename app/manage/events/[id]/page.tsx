import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EventTabs } from "@/components/manage/event-tabs";
import { Flash } from "@/components/manage/flash";
import { requireRole } from "@/lib/auth/session";
import { STAFF_ROLE_LABELS } from "@/lib/events/eligibility";
import { availableActions, TRANSITIONS } from "@/lib/events/lifecycle";
import { toggleEventFlag, transitionEvent } from "@/lib/events/manage-actions";
import { getManagedEvent } from "@/lib/events/manage-queries";
import { quoteSubtotal, quoteTotal } from "@/lib/events/pricing";
import { STATUS_LABELS } from "@/lib/events/status";
import { env } from "@/lib/env";
import { formatDate, formatDateTime, formatMoney, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Manage Event" };

export default async function ManageEventPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  await requireRole("event_mgmt");
  const { id } = await props.params;
  const { msg } = await props.searchParams;
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();
  const event = await getManagedEvent(eventId);
  if (!event) notFound();
  const actions = availableActions(event.status);
  const subtotal = quoteSubtotal(event.lineItems, event.customQuoteItems);
  const total = quoteTotal(subtotal, event.rentalPrice, event.discount);
  const flags = [
    ["isPlanning", "Planning (hide from overdue-quote nags)", event.isPlanning],
    ["preOpen", "Pre-open for head tech and senior staff", event.preOpen],
    ["isEmergency", "Emergency staffing (skip cooldowns)", event.isEmergency],
    ["rentalsOrdered", "Rentals ordered", event.rentalsOrdered],
    ["notifyStaff", "Include in staff digest", event.notifyStaff],
    ["isConfirmed", "Client confirmed quote", event.isConfirmed],
  ] as const;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h1 className="text-2xl font-bold">
          #{event.id} {event.name}
        </h1>
        <span className="rounded bg-muted px-2 py-0.5 text-sm">{STATUS_LABELS[event.status]}</span>
        <Link href={`/events/${event.id}`} className="text-sm underline">
          Staff view
        </Link>
        <a href={`${env.NEXT_PUBLIC_APP_URL}/brief/${event.publicToken}`} className="text-sm underline" target="_blank" rel="noreferrer">
          Client brief link
        </a>
      </div>
      <EventTabs id={event.id} active="overview" />
      <Flash code={msg} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded border p-4 grid gap-x-8 gap-y-1 sm:grid-cols-2 text-sm">
            <div>
              <span className="text-gray-600">Organization</span>
              <div>
                {event.orgName}
                {event.organization ? (
                  <Link href={`/manage/organizations/${event.organization.id}`} className="ml-2 underline text-xs">
                    profile{event.organization.alertFlag ? " (alert)" : ""}
                  </Link>
                ) : (
                  <span className="ml-2 text-xs text-amber-700">not linked to a profile</span>
                )}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Contact</span>
              <div>
                {event.contactName} · {event.contactEmail} · {event.contactPhone}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Advisor</span>
              <div>{event.advisorName ? `${event.advisorName} · ${event.advisorEmail}` : "none"}</div>
            </div>
            <div>
              <span className="text-gray-600">Account index</span>
              <div>{event.accountIndex || "none"}{event.isStudentOrg ? " · student org" : ""}</div>
            </div>
            <div>
              <span className="text-gray-600">Date and time</span>
              <div>
                {formatDate(event.eventDate)}, {formatTime(event.startAt)} to {formatTime(event.endAt)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Load in / sound check</span>
              <div>
                {event.loadInAt ? formatDateTime(event.loadInAt) : "not set"} / {event.soundcheckAt ? formatTime(event.soundcheckAt) : "none"}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Location</span>
              <div>{event.location}</div>
            </div>
            <div>
              <span className="text-gray-600">Reservation</span>
              <div>
                {event.reservationStartAt ? `${formatTime(event.reservationStartAt)} to ${formatTime(event.reservationEndAt)}` : "not set"}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Attendance</span>
              <div>{event.expectedAttendance || "unknown"}</div>
            </div>
            <div>
              <span className="text-gray-600">Submitted</span>
              <div>{formatDateTime(event.submittedAt)}</div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-gray-600">Needs</span>
              <div>{event.needs.join(", ") || "none selected"}</div>
            </div>
            <div className="sm:col-span-2">
              <span className="text-gray-600">Description</span>
              <div className="whitespace-pre-wrap">{event.description}</div>
            </div>
            {event.notes ? (
              <div className="sm:col-span-2">
                <span className="text-gray-600">Staff notes</span>
                <div className="whitespace-pre-wrap">{event.notes}</div>
              </div>
            ) : null}
            {event.planningNotes ? (
              <div className="sm:col-span-2">
                <span className="text-gray-600">Planning notes</span>
                <div className="whitespace-pre-wrap">{event.planningNotes}</div>
              </div>
            ) : null}
            {event.cancelReason ? (
              <div className="sm:col-span-2">
                <span className="text-gray-600">Cancellation reason</span>
                <div className="whitespace-pre-wrap">{event.cancelReason}</div>
              </div>
            ) : null}
          </section>

          <section className="rounded border p-4 text-sm space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">Quote</h2>
              <Link href={`/manage/events/${event.id}/packages`} className="underline text-xs">
                Edit packages
              </Link>
            </div>
            {event.lineItems.length + event.customQuoteItems.length === 0 ? (
              <p className="text-gray-600">No packages yet.</p>
            ) : (
              <ul className="divide-y">
                {event.lineItems.map((l) => (
                  <li key={`l${l.id}`} className="py-1 flex justify-between">
                    <span>
                      {Number(l.quantity) !== 1 ? `${Number(l.quantity)} × ` : ""}
                      {l.name}
                    </span>
                    <span>{formatMoney(Number(l.unitPrice) * Number(l.quantity))}</span>
                  </li>
                ))}
                {event.customQuoteItems.map((c) => (
                  <li key={`c${c.id}`} className="py-1 flex justify-between">
                    <span>{c.name} <span className="text-xs text-gray-500">(custom)</span></span>
                    <span>{formatMoney(c.price)}</span>
                  </li>
                ))}
              </ul>
            )}
            <dl className="grid grid-cols-[10rem_1fr] gap-y-0.5 pt-2 border-t">
              <dt className="text-gray-600">Subtotal</dt>
              <dd>{formatMoney(subtotal)}</dd>
              <dt className="text-gray-600">Rentals</dt>
              <dd>{formatMoney(event.rentalPrice)}</dd>
              <dt className="text-gray-600">Discount</dt>
              <dd>-{formatMoney(event.discount)}</dd>
              <dt className="font-semibold">Total</dt>
              <dd className="font-semibold">{formatMoney(total)}</dd>
              <dt className="text-gray-600">Quote status</dt>
              <dd>{event.quoteSentNote || "not sent"}{event.isConfirmed ? " · client confirmed" : ""}</dd>
            </dl>
          </section>

          <section className="rounded border p-4 text-sm space-y-2">
            <div className="flex items-baseline justify-between">
              <h2 className="font-semibold">Staff</h2>
              <Link href={`/manage/events/${event.id}/staff`} className="underline text-xs">
                Edit staffing
              </Link>
            </div>
            <p className="text-gray-600">
              Slots: crew {event.crewSlots}, senior {event.seniorStaffSlots}, AHT {event.ahtSlots}, LHT {event.lhtSlots}, VHT {event.vhtSlots}, DJ {event.djSlots}, spot {event.spotSlots}, camera {event.cameraSlots}, runner {event.runnerSlots}
            </p>
            {event.assignments.length === 0 ? (
              <p className="text-gray-600">Nobody assigned.</p>
            ) : (
              <ul className="grid gap-1 sm:grid-cols-2">
                {event.assignments.map((a) => (
                  <li key={a.id}>
                    <span className="text-gray-600">{STAFF_ROLE_LABELS[a.role]}:</span> {a.user.name}
                    {a.addedByStaff ? <span className="text-xs text-gray-500"> (added)</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded border p-4 space-y-2">
            <h2 className="font-semibold text-sm">Actions</h2>
            {actions.length === 0 ? <p className="text-xs text-gray-600">No status changes available.</p> : null}
            {actions.map((a) => {
              const t = TRANSITIONS[a];
              const needsReason = a === "cancel" || a === "deny";
              return (
                <form key={a} action={transitionEvent} className="space-y-1">
                  <input type="hidden" name="eventId" value={event.id} />
                  <input type="hidden" name="action" value={a} />
                  {needsReason ? (
                    <textarea name="reason" rows={2} required placeholder="Reason sent to the client" className="w-full border rounded px-2 py-1 text-xs" />
                  ) : null}
                  <button
                    type="submit"
                    className={`w-full rounded px-3 py-1.5 text-sm ${t.danger ? "border border-red-600 text-red-700" : "bg-brand text-white"}`}
                  >
                    {t.label}
                  </button>
                </form>
              );
            })}
            {event.status === "requested" || event.status === "confirmed" || event.status === "open" ? (
              <Link href={`/manage/events/${event.id}/packages`} className="block text-center text-sm underline pt-1">
                Send quote
              </Link>
            ) : null}
          </section>
          <section className="rounded border p-4 space-y-2">
            <h2 className="font-semibold text-sm">Flags</h2>
            {flags.map(([flag, label, value]) => (
              <form key={flag} action={toggleEventFlag} className="flex items-center justify-between gap-2 text-sm">
                <input type="hidden" name="eventId" value={event.id} />
                <input type="hidden" name="flag" value={flag} />
                <span>{label}</span>
                <button type="submit" className={`rounded px-2 py-0.5 text-xs border ${value ? "bg-green-100 border-green-400" : "bg-gray-50"}`}>
                  {value ? "On" : "Off"}
                </button>
              </form>
            ))}
            {event.autoOpen ? (
              <p className="text-xs text-gray-600">Auto-opens on {event.openOn ?? "(date not set)"} at 8 PM.</p>
            ) : null}
          </section>
        </aside>
      </div>
    </div>
  );
}
