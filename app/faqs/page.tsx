import type { Metadata } from "next";

export const metadata: Metadata = { title: "FAQs" };

const general: [string, React.ReactNode][] = [
  [
    "What does VUTC do?",
    "VUTC serves the Villanova community's audio, visual, and event management needs with high quality services at competitive prices. We cover everything from small lectures and club meetings to a cappella concerts and large university events.",
  ],
  [
    "Who can work with VUTC? Is experience required?",
    "No experience is required. We teach you everything you need to know. We also need staff who want to learn the business side: accounting, peer leadership, and organizing, tracking, and repairing equipment.",
  ],
  [
    "What kind of events has VUTC worked?",
    "Orientation, Special Olympics, Hoops Mania, CAT live music, a cappella concerts, guest lectures, dinners and banquets, and more.",
  ],
  [
    "How do I join VUTC?",
    <>
      Look for us at the fall or spring activity fairs, or email{" "}
      <a className="underline" href="mailto:contact@vutc.com">
        contact@vutc.com
      </a>
      . Once you sign up you will get an email about training.
    </>,
  ],
  [
    "How often does a staff member work?",
    "It varies with how many events are on the calendar and how much you want to work.",
  ],
  [
    "Are there leadership opportunities?",
    "Yes. VUTC is entirely student run. Head technicians and the executive board handle every part of the business. If you want to become a head technician, talk to the President or a Vice President. Executive board applications and interviews happen each year in late November and early December.",
  ],
];

const client: [string, React.ReactNode][] = [
  [
    "What services does VUTC provide?",
    "Audio, lighting, video, and event production for events of any size. Audio includes amplified sound, speakers, wireless microphones, and live band reinforcement. Lighting includes full stage lighting, dance party lighting, accent and uplighting, and spotlights. We also do video projection, livestreams, pipe and drape, and audio recording.",
  ],
  [
    "How do I submit an event request?",
    <>
      Use the{" "}
      <a className="underline" href="/request">
        event request form
      </a>
      . You will get a quote by email.
    </>,
  ],
  [
    "How far in advance should I submit?",
    "As early as possible and no less than 10 days before the event. We can often accommodate later requests, but cannot guarantee full services inside that window, and a rush fee may apply.",
  ],
  [
    "How do I change a request after submitting it?",
    <>
      Email{" "}
      <a className="underline" href="mailto:events@vutc.com">
        events@vutc.com
      </a>{" "}
      or the event manager you have been working with. We can only guarantee
      changes submitted at least two days before the event.
    </>,
  ],
  [
    "How do I know what equipment to request?",
    "It depends on the location, size, and type of event. A detailed description, including expected attendance, lets us prepare properly.",
  ],
  [
    "How do I find out who my head technician is?",
    "Your request confirmation email links to your event brief page. It shows your head technician's contact information once one is assigned.",
  ],
  [
    "Does VUTC work off campus?",
    "Yes, for university-sponsored activities such as formals and proms.",
  ],
  [
    "What music will a VUTC DJ play?",
    "Anything you request. Outdoor or public on-campus events are restricted to clean music by university policy.",
  ],
];

function PowerDropSteps({ title, request }: { title: string; request: string }) {
  return (
    <div className="space-y-2">
      <h3 className="font-semibold">{title}</h3>
      <ol className="list-decimal pl-5 text-sm space-y-1">
        <li>Open the Facilities SR System (from campus only).</li>
        <li>Choose Submit a Request from the left menu.</li>
        <li>Select Villanova University, then the building for your event.</li>
        <li>Enter your name, contact information, and the area.</li>
        <li>Enter your organization&apos;s account information (ask your advisor).</li>
        <li>
          In the Request section enter: <em>{request}</em>
        </li>
        <li>
          Include the specific event location and the date of the event, and
          note if load-in is a day early.
        </li>
      </ol>
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="space-y-10 max-w-3xl">
      <h1 className="text-3xl font-bold">Frequently Asked Questions</h1>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">General</h2>
        {general.map(([q, a]) => (
          <div key={q}>
            <h3 className="font-semibold">{q}</h3>
            <p className="text-sm text-gray-700">{a}</p>
          </div>
        ))}
      </section>
      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Clients</h2>
        {client.map(([q, a]) => (
          <div key={q}>
            <h3 className="font-semibold">{q}</h3>
            <p className="text-sm text-gray-700">{a}</p>
          </div>
        ))}
        <PowerDropSteps
          title="When do I need a three phase power drop?"
          request="Our event requires a three phase power drop for VUTC to power equipment at the event. Please contact them with any questions."
        />
        <PowerDropSteps
          title="Facilities request for the Jake Nevin speaker system"
          request="Our event requires the use of the installed speaker system in Jake Nevin and access to the amplification closet throughout the event. VUTC will use the speakers with their microphones and mixer. Please contact them with any questions."
        />
      </section>
    </div>
  );
}
