import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { academicYearStart, getLeaderboard } from "@/lib/events/staff-queries";

export const metadata: Metadata = { title: "Event Leaderboard" };

function Board({ title, rows }: { title: string; rows: { userId: string; name: string; gradYear: number | null; worked: number }[] }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xl font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-600">No events worked yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="py-1 w-10">#</th>
              <th className="py-1">Name</th>
              <th className="py-1">Class</th>
              <th className="py-1 text-right">Events</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.userId} className="border-t">
                <td className="py-1">{i + 1}</td>
                <td className="py-1">{r.name}</td>
                <td className="py-1">{r.gradYear ?? ""}</td>
                <td className="py-1 text-right">{r.worked}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

export default async function LeaderboardPage() {
  await requireUser();
  const [year, allTime] = await Promise.all([
    getLeaderboard(academicYearStart()),
    getLeaderboard(),
  ]);
  return (
    <div className="space-y-8 max-w-3xl">
      <h1 className="text-3xl font-bold">Event Leaderboard</h1>
      <div className="grid gap-8 md:grid-cols-2">
        <Board title="This academic year" rows={year.slice(0, 25)} />
        <Board title="All time" rows={allTime.slice(0, 25)} />
      </div>
    </div>
  );
}
