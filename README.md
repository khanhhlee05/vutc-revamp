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
| `npm run test:e2e` | Playwright tests |
| `npm run db:generate` | Create a migration from changes to `db/schema.ts` |
| `npm run db:migrate` | Apply migrations |
| `npm run db:seed` | Seed packages (and a dev admin) |
| `npm run db:reset` | Drop and recreate the local schema (local DBs only) |
| `npm run db:studio` | Drizzle Studio |

## Layout

```
app/            routes (public pages, /login, /dashboard, /manage/*, /api/*)
components/     shared React components
db/             schema.ts, migrations/, seed.ts, seed-data/
lib/auth/       better-auth instance, session helpers, role rules
lib/            audit log, email, env validation, domain logic
scripts/        maintenance and legacy migration scripts
tests/          unit and e2e tests
```

## Security rules

- All database access goes through Drizzle. `sql.raw` is banned by ESLint.
- `dangerouslySetInnerHTML` is banned by ESLint.
- Every page and server action under `/manage` and `/dashboard` calls
  `requireUser`, `requireRole`, `assertUser`, or `assertRole` from
  `lib/auth/session.ts`. `proxy.ts` only does an optimistic cookie check.
- Secrets live in environment variables only. `.env.local` is git-ignored.
- Passwords are hashed by better-auth (scrypt). Login is rate limited.
- Mutations that matter are written to `audit_log` through `lib/audit.ts`.
- Security headers (CSP, HSTS, frame denial) are set in `next.config.ts`.
