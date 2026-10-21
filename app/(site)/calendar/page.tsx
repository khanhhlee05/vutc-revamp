import type { Metadata } from "next";
import { getRecentPublicEvents, getUpcomingPublicEvents } from "@/lib/events/queries";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Calendar" };

export default async function CalendarPage() {
  const [upcoming, recent] = await Promise.all([
    getUpcomingPublicEvents(),
    getRecentPublicEvents(),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Event Calendar</h1>
      <section>
        <h2 className="text-xl font-semibold mb-3">Upcoming events</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nothing scheduled yet.</p>
        ) : (
          <ul className="divide-y rounded border">
            {upcoming.map((e) => (
              <li key={e.id} className="p-3 text-sm flex flex-wrap gap-x-4">
                <span className="w-40 text-muted-foreground">{formatDate(e.eventDate)}</span>
                <span className="font-medium">{e.name}</span>
                <span className="text-foreground/80">{e.orgName}</span>
                <span className="text-muted-foreground ml-auto">{e.location}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="text-xl font-semibold mb-3">Recent events</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-muted-foreground">No past events yet.</p>
        ) : (
          <ul className="divide-y rounded border">
            {recent.map((e) => (
              <li key={e.id} className="p-3 text-sm flex flex-wrap gap-x-4">
                <span className="w-40 text-muted-foreground">{formatDate(e.eventDate)}</span>
                <span className="font-medium">{e.name}</span>
                <span className="text-foreground/80">{e.orgName}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
