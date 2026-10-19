import type { Metadata } from "next";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { boardPositions, user } from "@/db/schema";

export const metadata: Metadata = { title: "About Us" };

export default async function AboutPage() {
  const board = await db
    .select({
      id: boardPositions.id,
      title: boardPositions.title,
      contactAbout: boardPositions.contactAbout,
      userName: user.name,
      userEmail: user.email,
      displayName: boardPositions.displayName,
      displayEmail: boardPositions.displayEmail,
    })
    .from(boardPositions)
    .leftJoin(user, eq(user.id, boardPositions.userId))
    .where(eq(boardPositions.isVisible, true))
    .orderBy(asc(boardPositions.sortOrder), asc(boardPositions.id));
  const year = new Date().getFullYear();

  return (
    <div className="space-y-8 max-w-3xl">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold">About Villanova University Tech Crew</h1>
        <p className="text-gray-700">
          VUTC is a completely student-operated organization that functions as
          an on-campus business. We provide live audio, lighting, video, and
          event production services at a professional level while reducing
          costs and improving the quality of campus activities.
        </p>
        <p className="text-gray-700">
          Staff learn professional audio, lighting, and event production in a
          hands-on environment. They also see the business side of the
          organization: budgets, payroll, marketing, and purchasing, along with
          teamwork, leadership, time management, and client communication.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">The {year} Executive Board</h2>
        {board.length === 0 ? (
          <p className="text-sm text-gray-600">
            Contact the board at{" "}
            <a className="underline" href="mailto:contact@vutc.com">
              contact@vutc.com
            </a>
            .
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-1">Position</th>
                <th className="py-1">Name</th>
                <th className="py-1">Contact them about</th>
              </tr>
            </thead>
            <tbody>
              {board.map((b) => {
                const name = b.userName ?? b.displayName ?? "Vacant";
                const email = b.userEmail ?? b.displayEmail;
                return (
                  <tr key={b.id} className="border-t">
                    <td className="py-2 pr-3 font-medium">{b.title}</td>
                    <td className="py-2 pr-3">
                      {name}
                      {email ? (
                        <>
                          <br />
                          <a className="underline text-gray-700" href={`mailto:${email}`}>
                            {email}
                          </a>
                        </>
                      ) : null}
                    </td>
                    <td className="py-2 text-gray-700">{b.contactAbout}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">History</h2>
        <p className="text-gray-700">
          VUTC traces its roots to the 1980s and VSMT Stage Crew, which
          provided technical support for shows in St. Mary&apos;s Theater. In the
          late 1990s a second group formed to handle the growing number of
          on-campus concerts, DJ nights, and other events outside the theater.
        </p>
        <p className="text-gray-700">
          In 2003 VUTC was chartered under Villanova&apos;s Office of Student
          Involvement. Since then the organization has changed advisors,
          rebuilt its equipment inventory (most of it purchased since 2013),
          and restructured its executive board.
        </p>
        <p className="text-gray-700">
          The first VUTC website launched in 2004 and was replaced in 2015.
          This site is the third generation, rebuilt by the Web Team.
        </p>
      </section>
    </div>
  );
}
