import type { Metadata } from "next";

export const metadata: Metadata = { title: "Client Policies" };

function Policy({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="text-sm text-foreground/80 space-y-2">{children}</div>
    </section>
  );
}

export default function PoliciesPage() {
  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold">Policies for Clients</h1>
        <p className="text-sm text-foreground/80 mt-2">
          These policies apply to clients and client events. By confirming a
          quote from VUTC you acknowledge that you have read them and agree to
          abide by them. Questions go to your events manager or the VUTC
          President, listed on the <a className="underline" href="/about">About</a> page.
        </p>
      </div>

      <Policy title="Clean music">
        <p>Events that are non-ticketed, open door, or open to the public must play entirely clean music: music free of vulgar or offensive language and inappropriate references, per university policy. This covers performances and background music. VUTC makes the final call on what counts as clean.</p>
        <p>Ticketed, closed-door events may play non-clean music. Permission from university staff may be needed in certain spaces or for certain events, and VUTC may refuse depending on the audience.</p>
      </Policy>

      <Policy title="Weather">
        <p>For events that do not need sensitive equipment, VUTC can work outdoors in light rain or moderate wind. Most lighting and video equipment is sensitive; those events cannot run outdoors in any precipitation. VUTC never works outdoors in high wind, lightning, thunder, or other extreme weather, and may cancel or suspend services when weather endangers people or equipment.</p>
        <p>Outdoor events must give VUTC a weather plan before the event. You may request a separate quote for a rain plan.</p>
        <ul className="list-disc pl-5">
          <li>Small events (under $500): rain plan due 2 days before. If it will be used, notify VUTC 3 hours before the event start or sound check, whichever is earlier.</li>
          <li>Large events (over $500): rain plan due 4 days before. VUTC will agree a decision deadline with you.</li>
        </ul>
        <p>Following a pre-established rain plan carries no cancellation fee, though work already begun may be charged. Switching to a rain plan after setup has begun may incur a rush fee of $50 or 10% of the event price, whichever is greater.</p>
      </Policy>

      <Policy title="Late night">
        <p>VUTC is student run and puts academics first. A late night fee applies when an event ends later than is reasonable for a student to be working:</p>
        <ul className="list-disc pl-5">
          <li>Under $500: ends at midnight or later.</li>
          <li>$501 to $999: ends at 11 PM or later.</li>
          <li>Over $1000: ends at 10 PM or later.</li>
        </ul>
        <p>VUTC may assess this fee even when an event falls outside these thresholds.</p>
      </Policy>

      <Policy title="Event requests">
        <p>Staff and equipment are allocated first come, first served by request submission time. If equipment is already booked, VUTC may offer rented equipment at a higher cost, or decline some or all requested services.</p>
      </Policy>

      <Policy title="Client obligations">
        <p>Files such as background tracks, graphics, videos, and playlists are due at least 5 days before the event unless your events manager agrees otherwise. Late files may not be usable; VUTC will choose replacement content at its discretion.</p>
        <p>Changes in services are guaranteed only if requested at least 2 days before the event; large changes, especially rentals, need more notice. Services added within 24 hours of the start may carry an additional fee.</p>
      </Policy>

      <Policy title="Cancellation">
        <ul className="list-disc pl-5">
          <li>Small events (under $500 quote): up to 10% of the quote if cancelled within 4 days, up to 25% within 24 hours.</li>
          <li>Large events (over $500 quote): up to 10% if cancelled within 7 days, up to 25% within 48 hours.</li>
        </ul>
        <p>If work has begun, including event coordination in the days before, that work is charged in addition to the fees above. Rental cancellation fees are passed through to the organization. VUTC may cancel services if conditions become unsafe and may still assess fees. VUTC will try to waive fees for cancellations beyond the organization&apos;s control; see the weather policy.</p>
      </Policy>

      <Policy title="Late event submissions">
        <p>Requests received within 10 days of the event may carry a rush fee of $50 or 10% of the event price, whichever is greater. Rush fees on rental orders are passed through.</p>
      </Policy>

      <Policy title="Equipment">
        <p>Ask before touching VUTC equipment, and treat it with care. If VUTC or rented equipment is damaged during an event by patrons, organization members, or unforeseeable circumstances, VUTC may hold the organization financially liable.</p>
      </Policy>

      <Policy title="Discounts">
        <p>10% new client discount on an organization&apos;s first event. 25% charity discount for events that directly benefit a charity; VUTC decides eligibility.</p>
      </Policy>

      <Policy title="Billing">
        <p>You receive a quote before the event is scheduled and must confirm it at the quoted price before services are performed. If services change right before or during the event you will be told the cost change, including operator time when events run early or late.</p>
        <p>Invoices are sent within 3 weeks of the event. Payment goes through the university&apos;s Banner system; only groups without a university account may pay by cash or check. A 10% finance fee may apply to invoices unpaid 30 days after receipt.</p>
      </Policy>

      <Policy title="Refusal of services">
        <p>VUTC may refuse service to organizations or recurring events based on past conduct.</p>
      </Policy>
    </div>
  );
}
