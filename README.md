# Freenances

Personal and business finance management via Open Finance and manual entries. Built with Next.js full-stack, a dual-context ledger (PF + PJ), category dashboards, monthly budgets, money flows, and a narrative feed.

## Overview

Freenances connects to banks through Open Finance (via Pluggy aggregator) and supports manual transaction tracking:

- **Dual ledger** — strict separation between personal (PF) and business (PJ) finances
- **Manual entries** — expenses/income with categories, installments, recurrence, and credit/cash modes
- **Unified dashboard** — monthly summary combining manual entries and bank-synced transactions
- **Category budgets** — monthly spending limits per category with progress alerts
- **Money flows** — obligations → reserves → discretionary → investment
- **Narrative feed** — human-readable financial events
- **Consent map** — Open Finance connections with expiry and revoke

### Tech stack

- Next.js 16 (App Router, Route Handlers, Server Actions)
- TypeScript strict
- PostgreSQL + Prisma
- Better Auth
- Tailwind CSS v4 (minimal design system)
- Pluggy (Open Finance aggregator)
- TanStack Query

## Architecture

```
src/
├── domain/           # Pure business rules (no Next/Prisma imports)
├── application/      # Use cases and ports
├── infrastructure/   # DB, auth, Pluggy adapter
├── ui/               # Design tokens, primitives, patterns
└── app/              # Next.js routes (UI + API)
```

Open Finance integration follows **Ports & Adapters**: the domain depends on `IOpenFinanceProvider`, implemented by `PluggyOpenFinanceProvider` or `StubOpenFinanceProvider` when credentials are absent.

## Getting started

### Prerequisites

- Node.js 22+
- [Aiven PostgreSQL](https://aiven.io/) service (connection string with `?sslmode=require`)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables and set DATABASE_URL to your Aiven Postgres URL
cp .env.example .env

npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Desktop app (same Aiven database)

Web, desktop, and Railway production all use the same `DATABASE_URL` (Aiven). Desktop only changes the app URL/port (`3847`).

```bash
# Optional: migrate legacy SQLite data into Aiven
npm run db:migrate-aiven

# Run desktop server
npm run desktop:dev

# Windows: open app-style window
npm run desktop:start
```

See [desktop/README.md](desktop/README.md) for the Tauri native shell.

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Aiven with `?sslmode=require`) |
| `DATABASE_CONNECTION_LIMIT` | Max Prisma pool size per instance (default `3`; keep low on Aiven) |
| `AUTH_SECRET` | Better Auth secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_SECRET` | Same value as `AUTH_SECRET` (Better Auth alias) |
| `NEXT_PUBLIC_APP_URL` | Public app URL (e.g. `http://localhost:3000`) |
| `BETTER_AUTH_URL` | Auth callback base URL (same as public URL in production) |
| `PLUGGY_CLIENT_ID` | Pluggy client ID (optional in dev) |
| `PLUGGY_CLIENT_SECRET` | Pluggy client secret (optional in dev) |
| `PLUGGY_WEBHOOK_SECRET` | Webhook signature validation |
| `CRON_SECRET` | Bearer token for `/api/cron/sync` |

Without Pluggy credentials, the app uses a **stub provider** that creates demo bank connections for local development.

### Deploy on Railway (app on Railway, database on Aiven)

Do **not** add Railway Postgres. Use your existing Aiven connection string for `DATABASE_URL`. Railway only runs the Next.js app (Docker container).

1. **Create a Railway project** and connect this repository.
2. **Add service variables** (Settings → Variables):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Aiven connection string (`?sslmode=require`) |
   | `DATABASE_CONNECTION_LIMIT` | `3` |
   | `AUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
   | `BETTER_AUTH_SECRET` | Same as `AUTH_SECRET` |
   | `NEXT_PUBLIC_APP_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |
   | `BETTER_AUTH_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |

3. **Deploy** — on each deploy the app runs `prisma db push` against **Aiven**, then starts on Railway's `PORT`.
4. **Health check** — `GET /api/health` verifies Aiven connectivity.
5. **Custom domain** (optional) — update `NEXT_PUBLIC_APP_URL` and `BETTER_AUTH_URL` and redeploy.

## API routes

| Route | Method | Description |
|---|---|---|
| `/api/auth/[...all]` | GET, POST | Better Auth handlers |
| `/api/entries` | GET, POST | List/create manual entries (with filters) |
| `/api/entries/[id]` | PATCH, DELETE | Update/delete manual entry |
| `/api/budgets` | GET, POST | List/create category budgets |
| `/api/budgets/[id]` | PATCH, DELETE | Update/delete category budget |
| `/api/transactions/[id]` | PATCH | Classify bank transaction |
| `/api/open-finance/connect` | POST | Create Pluggy connect token |
| `/api/open-finance/revoke` | POST | Revoke bank connection |
| `/api/context` | POST | Set PF/PJ context preference |
| `/api/locale` | POST | Set locale preference |
| `/api/webhooks/pluggy` | POST | Pluggy webhook receiver |
| `/api/cron/sync` | GET, POST | Reconcile all bank connections |
| `/api/health` | GET | Health check |

## App pages

| Route | Description |
|---|---|
| `/overview` | Unified monthly dashboard with trend |
| `/entries` | Manual transaction CRUD with filters |
| `/budgets` | Monthly category budgets |
| `/feed` | Balance, money flows, unclassified bank txs, narrative feed |
| `/connections` | Open Finance connections with revoke |

## Feature roadmap

### Phase 1 — Foundation (done)
- Auth, dual contexts, manual entries CRUD
- Pluggy connect stub/live, transaction sync pipeline
- Feed, flows, connections pages

### Phase 2 — Legacy product integration (current)
- Extended entry fields (installments, recurrence, credit/cash)
- Unified dashboard (manual + bank)
- Category budgets, bank transaction classification
- Navigation coherence, connection revoke

### Phase 3 — Intelligence & PJ
- Intent budgets, leakage guard, temporal lens
- Simulation sandbox, simplified DRE, exports

### Phase 4 — Scale
- Multiple CNPJs, family sharing, automation API

## Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint
npx prisma studio  # Database GUI
```

## License

Private — all rights reserved.
