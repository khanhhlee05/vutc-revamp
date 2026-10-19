import type { PayRouting, StaffRole } from "@/db/schema";

/** VUTC's share of the set/strike base pool. Legacy `$a`. */
export const VUTC_SHARE_RATE = 0.5;

export type SplitLine = { amount: number; routing: PayRouting };

export type SplitWorker = {
  id: number;
  role: StaffRole;
  /** Fraction of run time worked, 0..1. */
  run: number;
  /** Fraction of load in/out worked, 0..1. */
  load: number;
};

export type SplitInput = {
  /** Price-list lines, each already multiplied out (unit price × quantity). */
  lines: SplitLine[];
  /** Custom quote lines are treated as standard (set/strike) revenue. */
  customTotal: number;
  /** Discount the client received. VUTC absorbs it. */
  discount: number;
  workers: SplitWorker[];
  vutcShareRate?: number;
};

export type SplitResult = {
  pay: Map<number, number>;
  vutcShare: number;
  breakdown: {
    base: number;
    staffPool: number;
    vutcPure: number;
    wireless: number;
    power: number;
    rentalPickup: number;
    rentalDropoff: number;
    runtimeToVutc: number;
    roundingToVutc: number;
    opPools: Partial<Record<PayRouting, number>>;
  };
  warnings: string[];
};

const OP_ROUTING_FOR_ROLE: Partial<Record<StaffRole, PayRouting>> = {
  aht: "op_audio",
  lht: "op_light",
  vht: "op_video",
  dj: "op_dj",
  spot: "op_spot",
  camera: "op_camera",
  runner: "op_runner",
};

const HT_ROLES: StaffRole[] = ["aht", "lht", "vht"];
const HT_POOLS: PayRouting[] = ["op_audio", "op_light", "op_video"];

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * Port of the legacy timesheetAction.php pay split.
 *
 * - Op-time packages pay the matching operator role. A single operator takes
 *   the whole pool; several split it by run fraction.
 * - Wireless mic and power distribution revenue goes entirely to VUTC.
 * - Rental-routed packages are split between the rental pickup and dropoff
 *   drivers.
 * - Event staff or senior staff who log run time draw from the head tech
 *   pools in proportion to their run time; VUTC keeps its share of that draw.
 * - Everything else is the base. VUTC takes `vutcShareRate` of it; the rest
 *   is split by load fraction.
 * - The client discount comes out of VUTC's share once. (The legacy code
 *   subtracted it from both the staff pool and VUTC's share and dropped the
 *   difference; the finance officer should confirm this is the intended rule.)
 * - Cent rounding differences go to VUTC.
 */
export function computePaySplit(input: SplitInput): SplitResult {
  const rate = input.vutcShareRate ?? VUTC_SHARE_RATE;
  const warnings: string[] = [];
  const pay = new Map<number, number>(input.workers.map((w) => [w.id, 0]));
  const opPools: Partial<Record<PayRouting, number>> = {};
  let base = input.customTotal;
  let wireless = 0;
  let power = 0;
  let rentalPickup = 0;
  let rentalDropoff = 0;

  for (const line of input.lines) {
    switch (line.routing) {
      case "wireless":
        wireless += line.amount;
        break;
      case "power":
        power += line.amount;
        break;
      case "rental":
        rentalPickup += line.amount / 2;
        rentalDropoff += line.amount / 2;
        break;
      case "standard":
        base += line.amount;
        break;
      default:
        opPools[line.routing] = (opPools[line.routing] ?? 0) + line.amount;
    }
  }

  // Runtime reallocation for non-operator staff who logged run time.
  let runtimeToVutc = 0;
  const htRuntime = input.workers.filter((w) => HT_ROLES.includes(w.role)).reduce((s, w) => s + w.run, 0);
  for (const w of input.workers) {
    if (OP_ROUTING_FOR_ROLE[w.role] || w.run <= 0) continue;
    if (w.role === "rental_pickup" || w.role === "rental_dropoff") continue;
    const htPool = HT_POOLS.reduce((s, p) => s + (opPools[p] ?? 0), 0);
    if (htRuntime <= 0 || htPool <= 0) continue;
    const gross = cents(htPool * (w.run / htRuntime));
    const toVutc = cents(gross * rate);
    pay.set(w.id, (pay.get(w.id) ?? 0) + (gross - toVutc));
    runtimeToVutc += toVutc;
    const present = HT_POOLS.filter((p) => (opPools[p] ?? 0) > 0);
    const slice = cents(gross / present.length);
    for (const p of present) opPools[p] = Math.max(0, cents((opPools[p] ?? 0) - slice));
  }

  // Operator pools.
  for (const [routing, pool] of Object.entries(opPools) as [PayRouting, number][]) {
    if (!pool) continue;
    const role = (Object.keys(OP_ROUTING_FOR_ROLE) as StaffRole[]).find((r) => OP_ROUTING_FOR_ROLE[r] === routing);
    const ops = input.workers.filter((w) => w.role === role);
    if (ops.length === 0) {
      warnings.push(`No ${role} on the event; ${routing} revenue was added to the set/strike pool.`);
      base += pool;
      continue;
    }
    if (ops.length === 1) {
      pay.set(ops[0].id, (pay.get(ops[0].id) ?? 0) + pool);
      continue;
    }
    const totalRun = ops.reduce((s, o) => s + o.run, 0);
    for (const o of ops) {
      const share = totalRun > 0 ? pool * (o.run / totalRun) : pool / ops.length;
      pay.set(o.id, (pay.get(o.id) ?? 0) + cents(share));
    }
  }

  // Rental drivers.
  for (const w of input.workers) {
    if (w.role === "rental_pickup" && rentalPickup > 0) pay.set(w.id, (pay.get(w.id) ?? 0) + rentalPickup);
    if (w.role === "rental_dropoff" && rentalDropoff > 0) pay.set(w.id, (pay.get(w.id) ?? 0) + rentalDropoff);
  }
  const hasPickup = input.workers.some((w) => w.role === "rental_pickup");
  const hasDropoff = input.workers.some((w) => w.role === "rental_dropoff");
  if (rentalPickup > 0 && !hasPickup) warnings.push("Rental revenue exists but no rental pickup driver is assigned.");
  if (rentalDropoff > 0 && !hasDropoff) warnings.push("Rental revenue exists but no rental dropoff driver is assigned.");

  // Base pool: VUTC share, then loads.
  base = cents(base);
  const vutcPure = cents(base * rate);
  const staffPool = cents(base - vutcPure);
  const totalLoad = input.workers.reduce((s, w) => s + w.load, 0);
  let distributed = 0;
  if (staffPool > 0 && totalLoad > 0) {
    for (const w of input.workers) {
      if (w.load <= 0) continue;
      const amount = cents(staffPool * (w.load / totalLoad));
      pay.set(w.id, (pay.get(w.id) ?? 0) + amount);
      distributed += amount;
    }
  } else if (staffPool > 0) {
    warnings.push("Nobody logged load time; the set/strike pool stayed with VUTC.");
  }
  const roundingToVutc = cents(staffPool - distributed);

  for (const [id, amount] of pay) pay.set(id, cents(amount));
  const unclaimedRental = cents((hasPickup ? 0 : rentalPickup) + (hasDropoff ? 0 : rentalDropoff));
  const vutcShare = cents(vutcPure - input.discount + wireless + power + runtimeToVutc + roundingToVutc + unclaimedRental);

  return {
    pay,
    vutcShare,
    breakdown: {
      base,
      staffPool,
      vutcPure,
      wireless: cents(wireless),
      power: cents(power),
      rentalPickup: cents(rentalPickup),
      rentalDropoff: cents(rentalDropoff),
      runtimeToVutc: cents(runtimeToVutc),
      roundingToVutc,
      opPools,
    },
    warnings,
  };
}

/** Default timesheet fractions per role, matching the legacy form. */
export function defaultFractions(role: StaffRole): { run: number; load: number; runLocked: boolean; loadLocked: boolean } {
  switch (role) {
    case "aht":
    case "lht":
    case "vht":
    case "spot":
    case "camera":
    case "runner":
      return { run: 1, load: 1, runLocked: true, loadLocked: false };
    case "dj":
      return { run: 1, load: 0, runLocked: true, loadLocked: false };
    case "rental_pickup":
    case "rental_dropoff":
      return { run: 0, load: 0, runLocked: true, loadLocked: true };
    default:
      return { run: 0, load: 1, runLocked: false, loadLocked: false };
  }
}
