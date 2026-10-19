import { eq } from "drizzle-orm";
import type { Db } from "@/db";
import { customQuoteItems, eventLineItems, events, packages } from "@/db/schema";

export function lineTotal(unitPrice: string | number, quantity: string | number): number {
  return Math.round(Number(unitPrice) * Number(quantity) * 100) / 100;
}

/** Quote subtotal before rentals and discount. */
export function quoteSubtotal(
  lines: { unitPrice: string | number; quantity: string | number }[],
  custom: { price: string | number }[],
): number {
  const a = lines.reduce((s, l) => s + lineTotal(l.unitPrice, l.quantity), 0);
  const b = custom.reduce((s, c) => s + Number(c.price), 0);
  return Math.round((a + b) * 100) / 100;
}

/** Legacy rule: price = packages + custom lines + rental price - discount. */
export function quoteTotal(subtotal: number, rentalPrice: string | number, discount: string | number): number {
  return Math.round((subtotal + Number(rentalPrice) - Number(discount)) * 100) / 100;
}

/**
 * Recomputes events.price from its line items and, when op-time packages
 * are present, makes sure the matching head tech or operator slot is at
 * least one (legacy behavior: "values for each op role default to 1").
 */
export async function recomputeEventPrice(db: Db, eventId: number): Promise<void> {
  const [event, lines, custom] = await Promise.all([
    db.query.events.findFirst({ where: eq(events.id, eventId) }),
    db
      .select({
        unitPrice: eventLineItems.unitPrice,
        quantity: eventLineItems.quantity,
        payRouting: packages.payRouting,
        category: packages.category,
      })
      .from(eventLineItems)
      .leftJoin(packages, eq(packages.id, eventLineItems.packageId))
      .where(eq(eventLineItems.eventId, eventId)),
    db.select({ price: customQuoteItems.price }).from(customQuoteItems).where(eq(customQuoteItems.eventId, eventId)),
  ]);
  if (!event) return;
  const subtotal = quoteSubtotal(lines, custom);
  const total = quoteTotal(subtotal, event.rentalPrice, event.discount);

  const routes = new Set(lines.map((l) => l.payRouting));
  const needsAht = routes.has("op_audio") || routes.has("op_dj") || lines.some((l) => l.category === "audio");
  const bump = (current: number, needed: boolean) => (needed && current < 1 ? 1 : current);

  await db
    .update(events)
    .set({
      price: total.toFixed(2),
      ahtSlots: bump(event.ahtSlots, needsAht),
      lhtSlots: bump(event.lhtSlots, routes.has("op_light")),
      vhtSlots: bump(event.vhtSlots, routes.has("op_video")),
      djSlots: bump(event.djSlots, routes.has("op_dj")),
      spotSlots: bump(event.spotSlots, routes.has("op_spot")),
      cameraSlots: bump(event.cameraSlots, routes.has("op_camera")),
      runnerSlots: bump(event.runnerSlots, routes.has("op_runner")),
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId));
}
