import "@/db/load-env";
import { eq, isNotNull } from "drizzle-orm";
import { db, pool } from "@/db";
import { eventLineItems, events, organizations, packages } from "@/db/schema";
import { PACKAGE_ALIASES } from "./package-aliases";
import { parseDump } from "./parse-dump";
import { transformEvent, transformLineItem, transformOrganization } from "./transform";

/**
 * Loads clients, events, and work from a legacy MySQL dump into Postgres.
 *
 *   npx tsx scripts/migrate-legacy/run.ts path/to/vutc_new.sql
 *
 * Idempotent: rows are keyed by legacy id. Line items for already-migrated
 * events are replaced. Packages must be seeded first (npm run db:seed).
 */
async function main() {
  const file = process.argv[2];
  if (!file) throw new Error("Usage: tsx scripts/migrate-legacy/run.ts <dump.sql>");
  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PROD_MIGRATION !== "1") {
    throw new Error("Set ALLOW_PROD_MIGRATION=1 to run against production");
  }

  console.time("parse");
  const dump = await parseDump(file, ["clients", "events", "work"]);
  console.timeEnd("parse");
  const clients = dump.get("clients")!;
  const legacyEvents = dump.get("events")!;
  const work = dump.get("work")!;
  console.log(`parsed clients=${clients.length} events=${legacyEvents.length} work=${work.length}`);

  // Organizations
  for (const row of clients) {
    const org = transformOrganization(row);
    await db
      .insert(organizations)
      .values(org)
      .onConflictDoUpdate({ target: organizations.legacyId, set: { name: org.name, description: org.description, alertFlag: org.alertFlag, alertDate: org.alertDate } });
  }
  const orgRows = await db.select({ id: organizations.id, legacyId: organizations.legacyId }).from(organizations).where(isNotNull(organizations.legacyId));
  const orgIdByLegacy = new Map(orgRows.map((o) => [o.legacyId!, o.id]));
  console.log(`organizations: ${orgIdByLegacy.size}`);

  // Events
  let inserted = 0;
  let updated = 0;
  for (const row of legacyEvents) {
    const ev = transformEvent(row, orgIdByLegacy);
    const existing = await db.query.events.findFirst({ where: eq(events.legacyId, ev.legacyId!), columns: { id: true, publicToken: true } });
    if (existing) {
      const { publicToken: _token, ...rest } = ev;
      void _token;
      await db.update(events).set(rest).where(eq(events.id, existing.id));
      updated++;
    } else {
      await db.insert(events).values(ev);
      inserted++;
    }
  }
  console.log(`events: inserted=${inserted} updated=${updated}`);
  const eventRows = await db.select({ id: events.id, legacyId: events.legacyId }).from(events).where(isNotNull(events.legacyId));
  const eventIdByLegacy = new Map(eventRows.map((e) => [e.legacyId!, e.id]));

  // Line items: replace per migrated event.
  const pkgRows = await db.select({ id: packages.id, name: packages.name }).from(packages);
  const packageIdByName = new Map(pkgRows.map((p) => [p.name, p.id]));
  const migratedEventIds = [...eventIdByLegacy.values()];
  await db.transaction(async (tx) => {
    for (const id of migratedEventIds) {
      await tx.delete(eventLineItems).where(eq(eventLineItems.eventId, id));
    }
  });
  const unmatched = new Map<string, number>();
  let orphans = 0;
  const batch: NonNullable<ReturnType<typeof transformLineItem>>[] = [];
  for (const row of work) {
    const item = transformLineItem(row, eventIdByLegacy, packageIdByName, PACKAGE_ALIASES);
    if (!item) {
      orphans++;
      continue;
    }
    if (!item.packageId) unmatched.set(item.name, (unmatched.get(item.name) ?? 0) + 1);
    batch.push(item);
  }
  for (let i = 0; i < batch.length; i += 500) {
    await db.insert(eventLineItems).values(batch.slice(i, i + 500));
  }
  console.log(`line items: ${batch.length} inserted, ${orphans} orphans skipped (event missing)`);
  if (unmatched.size) {
    console.log("line items kept without a package link:");
    for (const [name, n] of [...unmatched.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${n}\t${name}`);
  }
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
