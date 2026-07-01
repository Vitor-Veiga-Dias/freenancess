# Layer Reference

## domain/

One folder per bounded concept. Files export types and pure functions.

| Module | Key exports |
|--------|-------------|
| `context/types` | `ContextType`, `isValidContextType` |
| `ledger/types` | `TransactionType`, `signedAmount`, `assertContextAssignable` |
| `flows/types` | `MoneyFlowType`, `buildMoneyFlows`, `DEFAULT_FLOW_LIMITS` |
| `consent/types` | `ConnectionStatus`, `isConsentExpiringSoon` |
| `insights/types` | `DomainEventType`, `toNarrativeFeedItem` |
| `intents/types` | `IntentEntity`, `intentProgress` |

```typescript
// Pattern: const array → type → helpers
export const CONTEXT_TYPES = ["PERSONAL", "BUSINESS"] as const;
export type ContextType = (typeof CONTEXT_TYPES)[number];
```

## application/

### ports/

Define interfaces external systems must implement. Keep normalized DTOs here or in domain.

### use-cases/

Orchestrate multi-step workflows. Current example: `sync-orchestrator.ts` — fetches from provider, upserts accounts/transactions, creates domain events.

When adding a use case:
1. Accept IDs or domain inputs, not raw request objects
2. Return structured result objects
3. Create `DomainEvent` records for user-visible outcomes

## infrastructure/

| Module | Role |
|--------|------|
| `db/prisma.ts` | Singleton Prisma client |
| `auth/auth.ts` | Better Auth server config |
| `auth/client.ts` | Better Auth React client |
| `auth/session.ts` | `getServerSession`, `requireSession` |
| `open-finance/pluggy/provider.ts` | Pluggy + stub implementations |

Environment variables stay in infrastructure only. Pages and domain never read `process.env` for secrets.

## ui/

```
tokens/cn.ts      — cn(), formatCurrency()
tokens/colors.ts  — brand palette
primitives/       — Button, Input, Card, Badge, SegmentedControl
patterns/         — AppShell, FlowBar, NarrativeCard, ContextSwitcher
providers.tsx     — TanStack Query provider
```

## app/

```
(marketing)/page.tsx     Public landing
(auth)/login|register    Client forms
(app)/layout.tsx         Session guard + ensureUserContexts + AppShell
(app)/feed|flows|...     Server Component pages
api/auth/[...all]        Better Auth catch-all
api/open-finance/connect POST connect flow
api/cron/sync            Manual/cron reconciliation
api/webhooks/pluggy      Pluggy event receiver
middleware.ts            Cookie-based route protection
```

## Prisma schema alignment

Domain enums mirror Prisma enums: `ContextType`, `ConnectionStatus`, `TransactionType`, `MoneyFlowType`, `DomainEventType`.

When adding a Prisma model:
1. Add enum/model to `prisma/schema.prisma`
2. Add corresponding domain types if business logic needs them
3. Run `npx prisma generate && npx prisma db push`

## Import examples

```typescript
// app page
import { requireSession } from "@/infrastructure/auth/session";
import { buildMoneyFlows } from "@/domain/flows/types";
import { FlowBar } from "@/ui/patterns/flow-bar";

// use case
import { createOpenFinanceProvider } from "@/infrastructure/open-finance/pluggy/provider";
import type { IOpenFinanceProvider } from "@/application/ports/open-finance";

// domain — only local imports
import type { ContextType } from "@/domain/context/types";
```
