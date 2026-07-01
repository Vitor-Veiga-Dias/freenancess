# Freenances

Personal and business finance management via Open Finance. Built with Next.js full-stack, a dual-context ledger (PF + PJ), flow-based budgeting, and a narrative feed instead of traditional category dashboards.

## Overview

Freenances connects to banks through Open Finance (via Pluggy aggregator) and helps you manage spending with a different approach:

- **Dual ledger** — strict separation between personal (PF) and business (PJ) finances
- **Money flows** — obligations → reserves → discretionary → investment
- **Narrative feed** — human-readable financial events, not spreadsheet rows
- **Consent map** — visible Open Finance connections with expiry and revoke support

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

- Node.js 20+
- PostgreSQL database

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client and push schema
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Better Auth secret (`openssl rand -base64 32`) |
| `NEXT_PUBLIC_APP_URL` | App URL (e.g. `http://localhost:3000`) |
| `PLUGGY_CLIENT_ID` | Pluggy client ID (optional in dev) |
| `PLUGGY_CLIENT_SECRET` | Pluggy client secret (optional in dev) |
| `PLUGGY_WEBHOOK_SECRET` | Webhook signature validation |
| `CRON_SECRET` | Bearer token for `/api/cron/sync` |

Without Pluggy credentials, the app uses a **stub provider** that creates demo bank connections for local development.

## API routes

| Route | Method | Description |
|---|---|---|
| `/api/auth/[...all]` | GET, POST | Better Auth handlers |
| `/api/open-finance/connect` | POST | Create Pluggy connect token |
| `/api/webhooks/pluggy` | POST | Pluggy webhook receiver |
| `/api/cron/sync` | GET, POST | Reconcile all bank connections |
| `/api/health` | GET | Health check |

## Feature roadmap

### Phase 1 — Foundation (current)
- Auth, dual contexts, Pluggy connect stub/live
- Transaction sync pipeline
- Feed, flows, connections pages

### Phase 2 — Product differentiation
- Intent budgets, leakage guard, temporal lens
- Consent map with revoke

### Phase 3 — Intelligence & PJ
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
