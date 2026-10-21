import Link from "next/link";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">Serving the Villanova Community</h1>
        <p className="max-w-2xl text-foreground/80">
          Villanova University Tech Crew provides audio, lighting, video, and
          DJ services for on-campus organizations. We are entirely student
          run and consistently beat outside vendor pricing.
        </p>
        <Link
          href="/request"
          className="inline-block bg-brand text-white px-5 py-2 rounded hover:bg-brand-dark"
        >
          Request an event quote
        </Link>
      </section>
      <section className="grid gap-6 md:grid-cols-3">
        <div className="rounded border p-4">
          <h2 className="font-semibold mb-1">Book early</h2>
          <p className="text-sm text-foreground/80">
            Submit a request at least 10 days before your event so we can
            quote it and staff it.
          </p>
        </div>
        <div className="rounded border p-4">
          <h2 className="font-semibold mb-1">What we do</h2>
          <p className="text-sm text-foreground/80">
            Formals, a cappella concerts, live music, speakers, showcases,
            projection, livestreams.
          </p>
        </div>
        <div className="rounded border p-4">
          <h2 className="font-semibold mb-1">Contact</h2>
          <p className="text-sm text-foreground/80">
            Events: <a className="underline" href="mailto:events@vutc.com">events@vutc.com</a>
            <br />
            Joining: <a className="underline" href="mailto:contact@vutc.com">contact@vutc.com</a>
          </p>
        </div>
      </section>
    </div>
  );
}
