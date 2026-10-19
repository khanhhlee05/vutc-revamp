import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { confirmQuote } from "@/lib/events/brief-action";
import { getEventByToken, getEventLeads } from "@/lib/events/queries";
import { clientStatusMessage, STATUS_LABELS } from "@/lib/events/status";
import { formatDate, formatMoney, formatTime } from "@/lib/format";

export const metadata: Metadata = { title: "Event Brief" };

const ROLE_TITLES: Record<string, string> = {
  aht: "Audio Head Tech",
  lht: "Lighting Head Tech",
  vht: "Video Head Tech",
  dj: "DJ",
};

export default async function BriefPage(props: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { token } = await props.params;
  const { submitted } = await props.searchParams;
  const event = await getEventByToken(token);
  if (!event) notFound();

  const showQuote =
    event.status !== "requested" &&
    event.status !== "cancelled" &&
    (event.lineItems.length > 0 || event.customQuoteItems.length > 0);
  const quoteLines = showQuote
    ? [
        ...event.lineItems.map((l) => ({
          id: `l${l.id}`,
          name: l.name,
          description: l.description,
          total: Number(l.unitPrice) * Number(l.quantity),
          qty: Number(l.quantity),
          unit: Number(l.unitPrice),
        })),
        ...event.customQuoteItems.map((c) => ({
          id: `c${c.id}`,
          name: c.name,
          description: c.description,
          total: Number(c.price),
          qty: 1,
          unit: Number(c.price),
        })),
      ]
    : [];
  const subtotal = quoteLines.reduce((s, l) => s + l.total, 0);
  const discount = Number(event.discount);
  const leads =
    event.status === "open" ||
    event.status === "completed" ||
    event.status === "payroll_created" ||
    event.status === "billed" ||
    event.status === "paid"
      ? await getEventLeads(event.id)
      : [];
  const canConfirm = event.status === "confirmed" && !event.isConfirmed;
  const confirm = confirmQuote.bind(null, token);

  return (
    <div className="space-y-8 max-w-3xl">
      {submitted ? (
        <p className="rounded border border-green-300 bg-green-50 p-3 text-sm">
          Thank you. Your request was submitted and a confirmation email is on
          its way. Bookmark this page to follow your event&apos;s status.
        </p>
      ) : null}

      <div>
        <p className="text-sm text-gray-600">Event brief #{event.id}</p>
        <h1 className="text-3xl font-bold">{event.name}</h1>
        <p className="text-gray-700">{event.orgName}</p>
      </div>

      <section className="rounded border p-4 space-y-2">
        <h2 className="font-semibold">
          Status: {STATUS_LABELS[event.status]}
          {event.isConfirmed && (event.status === "confirmed" || event.status === "open")
            ? " (client confirmed)"
            : ""}
        </h2>
        <p className="text-sm text-gray-700">
          {clientStatusMessage(event.status, {
            isPlanning: event.isPlanning,
            isConfirmed: event.isConfirmed,
          })}
        </p>
        {canConfirm ? (
          <form action={confirm}>
            <button type="submit" className="bg-brand text-white px-4 py-2 rounded text-sm">
              Confirm this quote
            </button>
            <p className="text-xs text-gray-600 mt-2">
              By confirming you agree to the{" "}
              <a href="/policies" className="underline">
                VUTC client policies
              </a>
              .
            </p>
          </form>
        ) : null}
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded border p-4">
          <h2 className="font-semibold mb-2">Event</h2>
          <dl className="text-sm grid grid-cols-[9rem_1fr] gap-y-1">
            <dt className="text-gray-600">Date</dt>
            <dd>{formatDate(event.eventDate)}</dd>
            <dt className="text-gray-600">Location</dt>
            <dd>{event.location}</dd>
            <dt className="text-gray-600">Load in</dt>
            <dd>{event.loadInAt ? formatTime(event.loadInAt) : "To be scheduled"}</dd>
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
          </dl>
        </div>
        <div className="rounded border p-4">
          <h2 className="font-semibold mb-2">Contacts</h2>
          <dl className="text-sm grid grid-cols-[9rem_1fr] gap-y-1">
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
            {leads.map((l) => (
              <div key={`${l.role}-${l.email}`} className="contents">
                <dt className="text-gray-600">{ROLE_TITLES[l.role] ?? l.role}</dt>
                <dd>
                  {l.name}
                  <br />
                  {l.email}
                </dd>
              </div>
            ))}
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
        ) : (
          <p className="text-sm text-gray-600">No checklist items selected.</p>
        )}
        <p className="text-sm whitespace-pre-wrap">{event.description}</p>
      </section>

      {showQuote ? (
        <section className="rounded border p-4">
          <h2 className="font-semibold mb-2">Quote</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-1">Package</th>
                <th className="py-1 text-right">Qty</th>
                <th className="py-1 text-right">Unit</th>
                <th className="py-1 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {quoteLines.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="py-1">
                    {l.name}
                    {l.description ? (
                      <span className="block text-xs text-gray-600">{l.description}</span>
                    ) : null}
                  </td>
                  <td className="py-1 text-right">{l.qty}</td>
                  <td className="py-1 text-right">{formatMoney(l.unit)}</td>
                  <td className="py-1 text-right">{formatMoney(l.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              {discount > 0 ? (
                <tr className="border-t">
                  <td colSpan={3} className="py-1 text-right">
                    Discount
                  </td>
                  <td className="py-1 text-right">-{formatMoney(discount)}</td>
                </tr>
              ) : null}
              <tr className="border-t font-semibold">
                <td colSpan={3} className="py-1 text-right">
                  Total
                </td>
                <td className="py-1 text-right">{formatMoney(subtotal - discount)}</td>
              </tr>
            </tfoot>
          </table>
        </section>
      ) : null}
    </div>
  );
}
