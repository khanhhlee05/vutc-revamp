import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { EventTabs } from "@/components/manage/event-tabs";
import { Flash } from "@/components/manage/flash";
import { requireRole } from "@/lib/auth/session";
import { addCustomItem, addLineItem, removeCustomItem, removeLineItem, sendQuote } from "@/lib/events/manage-actions";
import { getManagedEvent, listActivePackages } from "@/lib/events/manage-queries";
import { lineTotal, quoteSubtotal, quoteTotal } from "@/lib/events/pricing";
import { formatMoney } from "@/lib/format";

export const metadata: Metadata = { title: "Packages and Quote" };

const input = "border rounded px-2 py-1 text-sm";

export default async function PackagesPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ msg?: string }>;
}) {
  await requireRole("event_mgmt");
  const { id } = await props.params;
  const { msg } = await props.searchParams;
  const eventId = Number(id);
  if (!Number.isInteger(eventId)) notFound();
  const [event, pkgs] = await Promise.all([getManagedEvent(eventId), listActivePackages()]);
  if (!event) notFound();
  const subtotal = quoteSubtotal(event.lineItems, event.customQuoteItems);
  const total = quoteTotal(subtotal, event.rentalPrice, event.discount);
  const canQuote = ["requested", "confirmed", "open"].includes(event.status);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">
        #{event.id} {event.name}
      </h1>
      <EventTabs id={event.id} active="packages" />
      <Flash code={msg} />

      <section className="rounded border p-4 space-y-3">
        <h2 className="font-semibold">Packages</h2>
        {event.lineItems.length === 0 ? <p className="text-sm text-gray-600">No packages yet.</p> : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-1">Package</th>
                <th className="py-1 text-right">Unit</th>
                <th className="py-1 text-right">Qty</th>
                <th className="py-1 text-right">Total</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {event.lineItems.map((l) => (
                <tr key={l.id} className="border-t">
                  <td className="py-1">
                    {l.name}
                    {l.description ? <span className="block text-xs text-gray-600">{l.description}</span> : null}
                  </td>
                  <td className="py-1 text-right">{formatMoney(l.unitPrice)}</td>
                  <td className="py-1 text-right">{Number(l.quantity)}</td>
                  <td className="py-1 text-right">{formatMoney(lineTotal(l.unitPrice, l.quantity))}</td>
                  <td className="py-1 text-right">
                    <form action={removeLineItem}>
                      <input type="hidden" name="eventId" value={event.id} />
                      <input type="hidden" name="lineId" value={l.id} />
                      <button type="submit" className="text-xs underline text-red-700">Remove</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <form action={addLineItem} className="flex flex-wrap items-end gap-2 border-t pt-3">
          <input type="hidden" name="eventId" value={event.id} />
          <label className="text-sm">
            <span className="block text-xs text-gray-600">Package</span>
            <select name="packageId" required className={input}>
              {pkgs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {formatMoney(p.unitPrice)} ({p.category})
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="block text-xs text-gray-600">Qty / hours</span>
            <input name="quantity" type="number" step="0.5" min={0.5} defaultValue={1} className={`${input} w-24`} />
          </label>
          <label className="text-sm flex-1 min-w-48">
            <span className="block text-xs text-gray-600">Note on quote (optional)</span>
            <input name="description" maxLength={500} className={`${input} w-full`} />
          </label>
          <button type="submit" className="bg-brand text-white text-sm px-3 py-1.5 rounded">Add package</button>
        </form>
      </section>

      <section className="rounded border p-4 space-y-3">
        <h2 className="font-semibold">Custom lines</h2>
        {event.customQuoteItems.length === 0 ? <p className="text-sm text-gray-600">None.</p> : (
          <ul className="text-sm divide-y">
            {event.customQuoteItems.map((c) => (
              <li key={c.id} className="py-1 flex items-center gap-3">
                <span className="flex-1">
                  {c.name}
                  {c.description ? <span className="block text-xs text-gray-600">{c.description}</span> : null}
                </span>
                <span>{formatMoney(c.price)}</span>
                <form action={removeCustomItem}>
                  <input type="hidden" name="eventId" value={event.id} />
                  <input type="hidden" name="itemId" value={c.id} />
                  <button type="submit" className="text-xs underline text-red-700">Remove</button>
                </form>
              </li>
            ))}
          </ul>
        )}
        <form action={addCustomItem} className="flex flex-wrap items-end gap-2 border-t pt-3">
          <input type="hidden" name="eventId" value={event.id} />
          <label className="text-sm">
            <span className="block text-xs text-gray-600">Name</span>
            <input name="name" required maxLength={75} className={input} />
          </label>
          <label className="text-sm flex-1 min-w-48">
            <span className="block text-xs text-gray-600">Description</span>
            <input name="description" maxLength={1000} className={`${input} w-full`} />
          </label>
          <label className="text-sm">
            <span className="block text-xs text-gray-600">Price ($, negative for a credit)</span>
            <input name="price" type="number" step="0.01" required className={`${input} w-32`} />
          </label>
          <button type="submit" className="bg-brand text-white text-sm px-3 py-1.5 rounded">Add line</button>
        </form>
      </section>

      <section className="rounded border p-4 flex flex-wrap items-center gap-6">
        <dl className="text-sm grid grid-cols-[8rem_1fr] gap-y-0.5">
          <dt className="text-gray-600">Subtotal</dt><dd>{formatMoney(subtotal)}</dd>
          <dt className="text-gray-600">Rentals</dt><dd>{formatMoney(event.rentalPrice)}</dd>
          <dt className="text-gray-600">Discount</dt><dd>-{formatMoney(event.discount)}</dd>
          <dt className="font-semibold">Total</dt><dd className="font-semibold">{formatMoney(total)}</dd>
        </dl>
        <form action={sendQuote} className="ml-auto space-y-1 text-right">
          <input type="hidden" name="eventId" value={event.id} />
          <button type="submit" disabled={!canQuote} className="bg-brand text-white px-4 py-2 rounded text-sm disabled:opacity-50">
            Email quote to client
          </button>
          <p className="text-xs text-gray-600">
            {event.quoteSentNote || "Not sent yet"}. Sending moves a new request to Confirmed and resets the client confirmation.
          </p>
        </form>
      </section>
    </div>
  );
}
