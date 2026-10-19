import "@/db/load-env";
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool } from "@/db";
import { eventLineItems, events, packages, type NewEvent } from "@/db/schema";
import { addDays, todayString, zonedToUtc } from "@/lib/time";

/**
 * Creates a few sample events for local development and end-to-end tests.
 * Idempotent: events are keyed by name. Never run against production.
 */
async function main() {
  if (process.env.NODE_ENV === "production") throw new Error("dev fixtures only");
  const today = todayString();
  const pkg = await db.select().from(packages).where(eq(packages.name, "Extended PA")).limit(1);
  const mics = await db.select().from(packages).where(eq(packages.name, "Wireless Mics")).limit(1);

  const base = (name: string, date: string, extra: Partial<NewEvent>): NewEvent => ({
    publicToken: randomBytes(32).toString("base64url"),
    name,
    orgName: "Campus Activities Team",
    contactName: "Sam Client",
    contactEmail: "client@villanova.edu",
    contactPhone: "(610) 555-0100",
    advisorName: "Dr. Advisor",
    advisorEmail: "advisor@villanova.edu",
    accountIndex: "123456",
    location: "Villanova Room",
    eventDate: date,
    startAt: zonedToUtc(date, "19:00"),
    endAt: zonedToUtc(date, "22:00"),
    loadInAt: zonedToUtc(date, "16:00"),
    reservationStartAt: zonedToUtc(date, "15:30"),
    reservationEndAt: zonedToUtc(date, "23:00"),
    expectedAttendance: "200",
    needs: ["Large Audio Speaker System", "Wireless Microphones"],
    description: "Fixture event for development.",
    ...extra,
  });

  const fixtures: NewEvent[] = [
    base("Fixture: New Request", addDays(today, 20), { status: "requested" }),
    base("Fixture: Confirmed Pre-open", addDays(today, 12), {
      status: "confirmed",
      preOpen: true,
      isConfirmed: true,
      crewSlots: 5,
      ahtSlots: 1,
      seniorStaffSlots: 1,
      price: "400.00",
    }),
    base("Fixture: Open Event", addDays(today, 7), {
      status: "open",
      isConfirmed: true,
      openedAt: new Date(Date.now() - 6 * 3_600_000),
      crewSlots: 6,
      ahtSlots: 1,
      lhtSlots: 1,
      seniorStaffSlots: 1,
      price: "475.00",
    }),
    base("Fixture: Paid Event", addDays(today, -30), {
      status: "paid",
      isConfirmed: true,
      crewSlots: 4,
      ahtSlots: 1,
      price: "250.00",
      paidAt: new Date(),
    }),
  ];

  for (const f of fixtures) {
    const existing = await db.query.events.findFirst({ where: eq(events.name, f.name) });
    if (existing) continue;
    const [created] = await db.insert(events).values(f).returning({ id: events.id });
    if (f.status !== "requested" && pkg[0] && mics[0]) {
      await db.insert(eventLineItems).values([
        { eventId: created.id, packageId: pkg[0].id, name: pkg[0].name, unitPrice: pkg[0].unitPrice, quantity: "1" },
        { eventId: created.id, packageId: mics[0].id, name: mics[0].name, unitPrice: mics[0].unitPrice, quantity: "4" },
      ]);
    }
    console.log(`created event #${created.id}: ${f.name}`);
  }
}

main()
  .then(() => pool.end())
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
