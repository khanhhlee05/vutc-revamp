import "./load-env";

import { sql } from "drizzle-orm";
import { db, pool } from "./index";
import { packages, staffProfiles, user, userRoles } from "./schema";
import { packageSeeds } from "./seed-data/packages";

/**
 * Idempotent seed: upserts the price list and, outside production, a
 * development admin account. Run with `npm run db:seed`.
 */
async function main() {
  await db
    .insert(packages)
    .values(
      packageSeeds.map((p, i) => ({
        legacyId: p.legacyId,
        name: p.name,
        category: p.category,
        unitPrice: p.unitPrice,
        description: p.description,
        payRouting: p.payRouting,
        sortOrder: i,
      })),
    )
    .onConflictDoUpdate({
      target: packages.legacyId,
      set: {
        name: sql`excluded.name`,
        category: sql`excluded.category`,
        unitPrice: sql`excluded.unit_price`,
        description: sql`excluded.description`,
        payRouting: sql`excluded.pay_routing`,
        updatedAt: sql`now()`,
      },
    });
  console.log(`packages: ${packageSeeds.length} upserted`);

  if (process.env.NODE_ENV !== "production" && process.env.SEED_ADMIN_EMAIL) {
    // Password is set through better-auth so the hash format matches.
    const { auth } = await import("@/lib/auth/auth");
    const email = process.env.SEED_ADMIN_EMAIL;
    const password = process.env.SEED_ADMIN_PASSWORD ?? "dev-password-123!";
    const existing = await db.query.user.findFirst({
      where: (u, { eq }) => eq(u.email, email),
    });
    let id = existing?.id;
    if (!id) {
      const ctx = await auth.$context;
      const created = await ctx.internalAdapter.createUser(
        { email, name: "Dev Admin", emailVerified: true },
        { method: "admin" },
      );
      id = created.id;
      await ctx.internalAdapter.linkAccount({
        userId: id,
        providerId: "credential",
        accountId: id,
        password: await ctx.password.hash(password),
      });
      console.log(`admin user created: ${email} / ${password}`);
    }
    await db
      .insert(staffProfiles)
      .values({ userId: id, isActive: true, isApproved: true })
      .onConflictDoNothing();
    await db
      .insert(userRoles)
      .values({ userId: id, role: "exec" })
      .onConflictDoNothing();
    await db
      .update(user)
      .set({ name: "Dev Admin" })
      .where(sql`${user.id} = ${id}`);
  }
}

main()
  .then(async () => {
    await pool.end();
  })
  .catch(async (err) => {
    console.error(err);
    await pool.end();
    process.exit(1);
  });
