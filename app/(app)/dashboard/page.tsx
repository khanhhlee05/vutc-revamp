import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/auth/roles";
import { STAFF_ROLE_LABELS } from "@/lib/events/eligibility";
import {
  getMyAssignments,
  getMyPaySummary,
  getRecentWorkCount,
  getRecentlyOpened,
  getStaffNotifications,
} from "@/lib/events/staff-queries";
import { PAST_STATUSES, STATUS_LABELS } from "@/lib/events/status";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { todayString } from "@/lib/time";

export const metadata: Metadata = { title: "Dashboard" };

const RULES = [
  "Maintain a safe working environment at all times. Do not do anything that would endanger yourself or others.",
  "Signing up for events is a privilege and a commitment. Arrive promptly at the appropriate times, ready to do your best work.",
  "Wear closed-toe shoes appropriate for the working conditions. Sandals, flip-flops, and other open-toe shoes are prohibited.",
  "Lift only what you are comfortable with. Always team lift heavy equipment.",
];

export default async function DashboardPage() {
  const user = await requireUser();
  const [assignments, opened, pay, worked, notes] = await Promise.all([
    getMyAssignments(user.id),
    getRecentlyOpened(),
    getMyPaySummary(user.id),
    getRecentWorkCount(user.id),
    getStaffNotifications(),
  ]);
  const today = todayString();
  const upcoming = assignments
    .filter((a) => a.event.eventDate >= today && (a.event.status === "open" || a.event.status === "confirmed"))
    .reverse();
  const recent = assignments.filter((a) => PAST_STATUSES.includes(a.event.status)).slice(0, 8);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
        <p className="text-sm text-foreground/80">
          {user.roles.length ? user.roles.map((r) => ROLE_LABELS[r]).join(", ") : "Staff Member"}
          {" · "}You have worked {worked} of the last 50 events.
        </p>
        {!user.isApproved ? (
          <p className="mt-2 rounded border border-warning-border bg-warning-soft p-3 text-sm">
            Your account is awaiting approval from personnel management. You can browse events but not sign up yet.
          </p>
        ) : !user.isActive ? (
          <p className="mt-2 rounded border border-warning-border bg-warning-soft p-3 text-sm">
            Your account is inactive, usually because a required training was missed. Contact personnel management.
          </p>
        ) : null}
      </div>

      {notes.length ? (
        <section className="space-y-2">
          <h2 className="text-lg font-semibold">Notifications</h2>
          <ul className="space-y-2">
            {notes.map((n) => (
              <li key={n.id} className="rounded border border-info-border bg-info-soft p-3 text-sm">
                <span className="font-medium">{n.title}</span>
                {n.body ? <span className="block text-foreground/80 whitespace-pre-wrap">{n.body}</span> : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded border p-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">My upcoming events</h2>
            <Link href="/my-events" className="text-sm underline">
              All my events
            </Link>
          </div>
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing yet.</p>
          ) : (
            <ul className="text-sm divide-y">
              {upcoming.map((a) => (
                <li key={a.id} className="py-1.5 flex flex-wrap gap-x-3">
                  <span className="text-muted-foreground w-28">{formatDate(a.event.eventDate, { weekday: undefined, year: undefined })}</span>
                  <Link href={`/events/${a.event.id}`} className="font-medium hover:underline">
                    {a.event.name}
                  </Link>
                  <span className="text-foreground/80">{STAFF_ROLE_LABELS[a.role]}</span>
                  <span className="text-muted-foreground ml-auto">
                    Load in {a.event.loadInAt ? formatTime(a.event.loadInAt) : formatTime(a.event.startAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border p-4 space-y-2">
          <div className="flex items-baseline justify-between">
            <h2 className="font-semibold">Recently opened events</h2>
            <Link href="/events" className="text-sm underline">
              Sign up
            </Link>
          </div>
          {opened.length === 0 ? (
            <p className="text-sm text-muted-foreground">No open events.</p>
          ) : (
            <ul className="text-sm divide-y">
              {opened.map((e) => (
                <li key={e.id} className="py-1.5 flex flex-wrap gap-x-3">
                  <span className="text-muted-foreground w-28">{formatDate(e.eventDate, { weekday: undefined, year: undefined })}</span>
                  <Link href={`/events/${e.id}`} className="font-medium hover:underline">
                    {e.name}
                  </Link>
                  <span className="text-muted-foreground ml-auto">
                    {e.signedUp}/{e.crewSlots} staff
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded border p-4 space-y-2">
          <h2 className="font-semibold">Pay</h2>
          <dl className="text-sm grid grid-cols-[12rem_1fr] gap-y-1">
            <dt className="text-muted-foreground">Earned this month</dt>
            <dd>{formatMoney(pay.thisMonth)}</dd>
            <dt className="text-muted-foreground">Last payroll</dt>
            <dd>
              {pay.lastPayroll
                ? `${formatMoney(pay.lastPayroll.total)} (payroll #${pay.lastPayroll.payrollId}${pay.lastPayroll.paidOutAt ? `, paid ${formatDate(pay.lastPayroll.paidOutAt)}` : ", pending"})`
                : "None yet"}
            </dd>
          </dl>
        </section>

        <section className="rounded border p-4 space-y-2">
          <h2 className="font-semibold">My recent events</h2>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground">None yet.</p>
          ) : (
            <ul className="text-sm divide-y">
              {recent.map((a) => (
                <li key={a.id} className="py-1.5 flex flex-wrap gap-x-3">
                  <span className="text-muted-foreground w-28">{formatDate(a.event.eventDate, { weekday: undefined, year: undefined })}</span>
                  <span className="font-medium">{a.event.name}</span>
                  <span className="text-foreground/80">{STAFF_ROLE_LABELS[a.role]}</span>
                  <span className="ml-auto">{formatMoney(a.pay)}</span>
                  <span className="text-xs text-muted-foreground">{STATUS_LABELS[a.event.status]}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded border p-4">
        <h2 className="font-semibold mb-2">Tech Crew rules</h2>
        <ol className="list-decimal pl-5 text-sm space-y-1">
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </section>
    </div>
  );
}
