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
- PostgreSQL on [Railway](https://railway.app/) (Postgres plugin in the same project)

### Setup

```bash
npm install
cp .env.example .env
```

Set `DATABASE_URL` to the Railway Postgres **public** URL (Postgres service → **Connect** → **Public Network**).

```bash
npx prisma generate
npx prisma db push
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Migrate data (Aiven → Railway Postgres)

**Option A — from your machine**

1. In `.env`:

   ```env
   SOURCE_DATABASE_URL=postgres://...@aiven...?sslmode=require
   TARGET_DATABASE_URL=postgresql://postgres:...@HOST.proxy.rlwy.net:PORT/railway
   ```

   Use the **resolved** public URL from Railway (not `${{...}}` templates).

2. Run `npm run db:migrate`
3. Set `DATABASE_URL` to the same Railway public URL for local dev.

**Option B — inside Railway**

1. On the **app service**, add temporarily: `SOURCE_DATABASE_URL=<aiven url>`
2. Ensure `DATABASE_URL=${{Postgres.DATABASE_URL}}`
3. Railway → app service → **Shell** → `npm run db:migrate`
4. Remove `SOURCE_DATABASE_URL` after migration.

### Desktop app (same Railway database)

Web, desktop, and Railway production share `DATABASE_URL`. Desktop only changes the app URL/port (`3847`).

```bash
npm run desktop:bundle
npm run desktop:prod
```

See [desktop/README.md](desktop/README.md) for the Tauri native shell.

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `DATABASE_CONNECTION_LIMIT` | Prisma pool size per instance (default `3`; use `5` on Railway Postgres) |
| `AUTH_SECRET` | Better Auth secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_SECRET` | Same value as `AUTH_SECRET` |
| `NEXT_PUBLIC_APP_URL` | Public app URL |
| `BETTER_AUTH_URL` | Auth callback base URL (same as public URL in production) |
| `PLUGGY_CLIENT_ID` | Pluggy client ID (optional in dev) |
| `PLUGGY_CLIENT_SECRET` | Pluggy client secret (optional in dev) |
| `PLUGGY_WEBHOOK_SECRET` | Webhook signature validation |
| `CRON_SECRET` | Bearer token for `/api/cron/sync` |

Without Pluggy credentials, the app uses a **stub provider** for local development.

### Deploy on Railway

Two services: **Postgres plugin** + **Freenances app**.

#### Postgres plugin

Railway manages `POSTGRES_USER`, `DATABASE_URL`, etc. Do not copy these manually into the app.

#### Freenances app service

| Variable | Value |
|---|---|
| `DATABASE_URL` | `${{Postgres.DATABASE_URL}}` |
| `DATABASE_CONNECTION_LIMIT` | `5` |
| `AUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `BETTER_AUTH_SECRET` | Same as `AUTH_SECRET` |
| `NEXT_PUBLIC_APP_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |
| `BETTER_AUTH_URL` | `https://${{RAILWAY_PUBLIC_DOMAIN}}` |

Deploy uses `railway.toml` + `Dockerfile`. Each deploy runs `prisma db push` on Railway Postgres, then starts on Railway's `PORT`.

Health check: `GET /api/health`.

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
npm run dev          # Development server
npm run build        # Production build
npm run start        # Production server
npm run db:migrate   # Copy data between databases (Aiven → Railway)
npm run lint         # ESLint
npx prisma studio    # Database GUI
```

## License

Private — all rights reserved.
