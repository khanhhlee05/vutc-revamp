import "@/db/load-env";
import { count, eq, isNotNull, sql } from "drizzle-orm";
import { db, pool } from "@/db";
import { eventLineItems, events, organizations } from "@/db/schema";
import { parseDump } from "./parse-dump";
import { STATUS_MAP } from "./transform";

/** Compares the migrated Postgres rows against the dump. Exits 1 on mismatch. */
async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: tsx scripts/migrate-legacy/verify.ts <dump.sql>");
  const dump = await parseDump(file, ["clients", "events", "work"]);
  const legacyEvents = dump.get("events")!;
  const legacyIds = new Set(legacyEvents.map((e) => Number(e.id)));
  const expectedLines = dump.get("work")!.filter((w) => legacyIds.has(Number(w.eventid))).length;

  const [[orgs], [evs], [lines]] = await Promise.all([
    db.select({ n: count() }).from(organizations).where(isNotNull(organizations.legacyId)),
    db.select({ n: count() }).from(events).where(isNotNull(events.legacyId)),
    db
      .select({ n: count() })
      .from(eventLineItems)
      .innerJoin(events, eq(events.id, eventLineItems.eventId))
      .where(isNotNull(events.legacyId)),
  ]);
  const checks: [string, number, number][] = [
    ["organizations", dump.get("clients")!.length, orgs.n],
    ["events", legacyEvents.length, evs.n],
    ["line items (non-orphan)", expectedLines, lines.n],
  ];

  const expectedStatus = new Map<string, number>();
  for (const e of legacyEvents) {
    const s = STATUS_MAP[e.status ?? "1"] ?? "requested";
    expectedStatus.set(s, (expectedStatus.get(s) ?? 0) + 1);
  }
  const actualStatus = await db
    .select({ status: events.status, n: count() })
    .from(events)
    .where(isNotNull(events.legacyId))
    .groupBy(events.status);
  for (const [status, n] of expectedStatus) {
    checks.push([`status ${status}`, n, actualStatus.find((a) => a.status === status)?.n ?? 0]);
  }

  // Spot check 20 events field by field.
  const sample = legacyEvents.filter((_, i) => i % Math.max(1, Math.floor(legacyEvents.length / 20)) === 0).slice(0, 20);
  let mismatches = 0;
  for (const le of sample) {
    const ev = await db.query.events.findFirst({ where: eq(events.legacyId, Number(le.id)) });
    const problems: string[] = [];
    if (!ev) problems.push("missing");
    else {
      if (ev.name !== (le.eventName ?? "").trim()) problems.push(`name ${ev.name} != ${le.eventName}`);
      if (ev.eventDate !== le.date) problems.push(`date ${ev.eventDate} != ${le.date}`);
      if (Number(ev.price) !== Number(le.price)) problems.push(`price ${ev.price} != ${le.price}`);
      if (ev.contactEmail !== (le.email ?? "").trim().toLowerCase()) problems.push("email");
      if (ev.crewSlots !== Number(le.crew)) problems.push("crew");
      const [{ total }] = await db
        .select({ total: sql<string>`coalesce(sum(${eventLineItems.unitPrice} * ${eventLineItems.quantity}), 0)` })
        .from(eventLineItems)
        .where(eq(eventLineItems.eventId, ev.id));
      const legacyTotal = dump
        .get("work")!
        .filter((w) => w.eventid === le.id)
        .reduce((s, w) => s + Number(w.price) * Number(w.amount), 0);
      if (Math.abs(Number(total) - legacyTotal) > 0.01) problems.push(`lines ${total} != ${legacyTotal}`);
    }
    if (problems.length) {
      mismatches++;
      console.log(`event ${le.id}: ${problems.join("; ")}`);
    }
  }

  let failed = false;
  for (const [label, expected, actual] of checks) {
    const ok = expected === actual;
    if (!ok) failed = true;
    console.log(`${ok ? "ok  " : "FAIL"} ${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`${mismatches === 0 ? "ok  " : "FAIL"} spot check: ${sample.length - mismatches}/${sample.length} events match`);
  if (failed || mismatches) process.exit(1);
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
