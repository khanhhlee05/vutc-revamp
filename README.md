# VUTC Website (rebuild)

Villanova University Tech Crew's public site and internal operations system:
event quote requests, staff signup, event management, timesheets, payroll,
and billing. This replaces the 2015 PHP site.

## Stack

- Next.js 16 (App Router, TypeScript, Tailwind)
- PostgreSQL with Drizzle ORM (Neon in production)
- better-auth for email + password sessions
- Resend for email, @react-pdf/renderer for bills and payroll PDFs
- Vitest for unit tests, Playwright for end to end

## Local setup

Requirements: Node 20.9+ and a Postgres 16 server.

```bash
cp .env.example .env.local        # then edit DATABASE_URL and BETTER_AUTH_SECRET
npm install
npm run db:migrate                # applies db/migrations to DATABASE_URL
SEED_ADMIN_EMAIL=you@villanova.edu SEED_ADMIN_PASSWORD='choose-a-long-one' npm run db:seed
npm run dev                       # http://localhost:3000
```

`db:seed` upserts the price list and, outside production, creates an exec
admin account for the email you pass.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` / `npm start` | Production build and serve |
| `npm run lint` / `npm run typecheck` | ESLint and `tsc --noEmit` |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | Playwright tests (builds first: `npm run build`). Set `PW_CHROMIUM_PATH` to reuse a preinstalled Chromium. |
| `npm run db:generate` | Create a migration from changes to `db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed packages (and a dev admin) |
| `npm run db:fixtures` | Create sample events for development and e2e tests |
| `npm run db:reset` | Drop and recreate the local schema (local DBs only) |
| `npm run db:studio` | Drizzle Studio |

## End to end tests

```bash
npm run build
SEED_ADMIN_EMAIL=admin@vutc.test SEED_ADMIN_PASSWORD='dev-password-123!' npm run db:seed
npm run db:fixtures
npm run test:e2e
```

The tests expect the seeded admin and the fixture events above. Playwright
starts `next start` on port 3100 by itself. Login is rate limited to 5
attempts a minute per IP, so a setup project signs in once and shares the
session; if a local run fails at login, wait a minute or clear the
`rate_limit` table.

## Layout

```
app/            routes (public pages, /login, /dashboard, /events, /manage/*, /api/*)
                /manage/events: event lifecycle, details, packages and quote, staffing
                /manage/organizations, /manage/users, /manage/notifications, /manage/board
components/     shared React components
db/             schema.ts, migrations/, seed.ts, seed-data/
lib/auth/       better-auth instance, session helpers, role rules
lib/events/     eligibility rules, lifecycle transition table, pricing, management actions
lib/pay/        pay split (pure, unit tested), timesheet, payroll, and billing actions
lib/pdf/        quote, invoice, and payroll PDFs (@react-pdf/renderer)
lib/            audit log, email templates, env validation, storage, Turnstile
scripts/        maintenance and legacy migration scripts
tests/          unit and e2e tests
```

## Pay split rules

`lib/pay/split.ts` ports the legacy timesheet math. Revenue is routed by
`packages.payRouting`: operator packages pay the matching operator (split by
run fraction when several hold the role), wireless mics and power distribution
go to VUTC, rental packages are split between the pickup and dropoff drivers,
and everything else is the base pool. VUTC takes 50% of the base; the rest is
split by load fraction. Event or senior staff who log run time draw from the
head tech pools in proportion to their run time.

One deliberate change from the legacy code, to confirm with the VP of Finance:
the client discount is charged to VUTC's share once. The old site subtracted
it from both the staff pool and VUTC's share and silently dropped the
difference, so payouts plus VUTC share did not add up to what the client paid.

## Security rules

- All database access goes through Drizzle. `sql.raw` is banned by ESLint.
- `dangerouslySetInnerHTML` is banned by ESLint.
- Every page and server action under `/manage` and `/dashboard` calls
  `requireUser`, `requireRole`, `assertUser`, or `assertRole` from
  `lib/auth/session.ts`. `proxy.ts` only does an optimistic cookie check.
- Secrets live in environment variables only. `.env.local` is git-ignored.
- Passwords are hashed by better-auth (scrypt). Login is rate limited.
- Mutations that matter are written to `audit_log` through `lib/audit.ts`.
- Staff signup eligibility is a pure function in `lib/events/eligibility.ts`
  with unit tests; server actions re-evaluate it before writing.
- Security headers (CSP, HSTS, frame denial) are set in `next.config.ts`.
