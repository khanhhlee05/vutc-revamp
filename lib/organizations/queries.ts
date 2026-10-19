import "server-only";
import { asc, count, desc, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { events, organizations } from "@/db/schema";

export async function listOrganizations() {
  return db
    .select({
      id: organizations.id,
      name: organizations.name,
      alertFlag: organizations.alertFlag,
      eventCount: count(events.id),
      lastEvent: max(events.eventDate),
    })
    .from(organizations)
    .leftJoin(events, eq(events.organizationId, organizations.id))
    .groupBy(organizations.id)
    .orderBy(asc(organizations.name));
}

export async function getOrganization(id: number) {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, id),
    with: {
      comments: { with: { user: true }, orderBy: (t, { desc }) => [desc(t.createdAt)] },
      events: {
        orderBy: (t, { desc }) => [desc(t.eventDate)],
        columns: { id: true, name: true, status: true, eventDate: true, price: true },
      },
    },
  });
  return org ?? null;
}

export { desc };
