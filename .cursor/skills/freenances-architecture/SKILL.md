---
name: freenances-architecture
description: Guides Freenances layered architecture (domain, application, infrastructure, ui, app). Use when adding features, refactoring modules, choosing where code belongs, or questions about PF/PJ contexts, money flows, Open Finance ports, or project structure.
---

# Freenances Architecture

## Quick decision tree

```
New code needed?
├── Pure business rule (validation, calculation, type)     → domain/
├── Orchestration across DB + external service             → application/use-cases/
├── Interface for external dependency                      → application/ports/
├── Prisma, auth, Pluggy, env vars                         → infrastructure/
├── Reusable visual element                                → ui/primitives/ or ui/patterns/
└── Page, layout, API route                                → app/
```

## Layer responsibilities

| Layer | Owns | Must not |
|-------|------|----------|
| `domain/` | Types, constants, pure functions, domain errors | Import framework/DB |
| `application/` | Use cases, port interfaces | UI rendering |
| `infrastructure/` | Adapters implementing ports | Page/layout logic |
| `ui/` | Tokens, components | Data fetching |
| `app/` | Routes, composition, thin handlers | Heavy business logic |

Full reference: [layers.md](layers.md)

## Domain vocabulary

- **FinancialContext**: PERSONAL or BUSINESS ledger scope per user
- **BankConnection**: Open Finance consent linked to a context
- **MoneyFlow**: allocation across OBLIGATIONS, RESERVES, DISCRETIONARY, INVESTMENT
- **DomainEvent**: narrative feed source (TRANSACTION_SYNCED, LEAKAGE_DETECTED, etc.)
- **Intent**: budget-by-intention (schema exists, UI pending)

## Open Finance pattern

1. Port: `IOpenFinanceProvider` in `application/ports/open-finance.ts`
2. Adapter: `PluggyOpenFinanceProvider` + `StubOpenFinanceProvider`
3. Factory: `createOpenFinanceProvider()` picks stub when credentials absent
4. Sync: `syncConnection()` / `syncAllConnections()` in `sync-orchestrator.ts`
5. Normalized types cross the boundary — never leak Pluggy shapes into domain

## Auth pattern

- Server: `requireSession()` / `getServerSession()` via Better Auth
- Client: `signIn`, `signUp`, `signOut` from `infrastructure/auth/client`
- On first app load: `ensureUserContexts(userId)` creates PF + PJ contexts

## Before finishing a change

- [ ] Code is in the correct layer
- [ ] `domain/` has zero external imports
- [ ] PF/PJ queries filter by `ContextType` when context-specific
- [ ] New API routes validate input with Zod
- [ ] UI uses existing primitives/tokens
- [ ] Stub path works without Pluggy credentials
