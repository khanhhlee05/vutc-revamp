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

## Scheduled jobs

Two endpoints under `/api/cron` are called by Vercel Cron (see `vercel.json`)
with `Authorization: Bearer $CRON_SECRET`:

| Path | Schedule (UTC) | Does |
|---|---|---|
| `/api/cron/evening` | 00:00 (8 PM EDT / 7 PM EST) | Opens events whose auto-open date has arrived, then emails the daily digest to staff who opted in |
| `/api/cron/midnight` | 05:00 (1 AM EDT / midnight EST) | Emails the events inbox about events in the next two days that are short on senior staff |

Any scheduler that can send the bearer header works (GitHub Actions, cron on a
VPS) if the app is not on Vercel.

## Migrating the legacy database

Only four legacy tables are migrated: `clients`, `pricing`, `events`, `work`.
Staff accounts, pay history, and custom quotes start fresh.

```bash
npm run db:migrate && npm run db:seed          # schema + price list
npm run migrate:legacy -- path/to/vutc_new.sql # clients -> organizations, events, work -> line items
npm run migrate:verify -- path/to/vutc_new.sql # counts, status distribution, 20 spot checks
```

The migration parses the phpMyAdmin dump directly (no MySQL needed), is
idempotent (keyed by legacy id), converts wall-clock times from
America/New_York to UTC, turns `<br/>`-separated needs into an array, and
generates a new unguessable brief token per event. Legacy package names that
drifted from the price list are mapped in
`scripts/migrate-legacy/package-aliases.ts`; unmatched names keep the line with
no package link so old invoices still render. Against production set
`ALLOW_PROD_MIGRATION=1`.

## Deploying

1. **Database**: create a Neon project, copy the pooled connection string to
   `DATABASE_URL`, run `npm run db:migrate` and `npm run db:seed` against it.
2. **Email**: create a Resend API key, verify `vutc.com` (SPF and DKIM DNS
   records), set `RESEND_API_KEY`, `EMAIL_FROM`, `EVENTS_INBOX`.
3. **Bot protection**: create a Cloudflare Turnstile widget for the domain and
   set `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`.
4. **Attachments**: create a Vercel Blob store and set `BLOB_READ_WRITE_TOKEN`
   (optional; without it attachments are accepted but not stored).
5. **Vercel**: import the repo, add every variable from `.env.example`
   (`BETTER_AUTH_SECRET` from `openssl rand -base64 32`, `CRON_SECRET`
   likewise, `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` set to
   `https://www.vutc.com`). Vercel reads `vercel.json` for the cron jobs.
6. **First admin**: run `SEED_ADMIN_EMAIL=... SEED_ADMIN_PASSWORD=... npm run db:seed`
   once against production from a trusted machine, sign in, change the
   password, then invite the rest of the board from Manage > Personnel.
7. **Cutover**: freeze the old site, run the legacy migration and verifier
   against the production database, point DNS at Vercel, keep the old site
   reachable on a subdomain behind basic auth for historical pay lookups.

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
