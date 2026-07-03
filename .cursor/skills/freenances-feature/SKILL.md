---
name: freenances-feature
description: Step-by-step workflow for implementing new Freenances features across domain, application, infrastructure, app, and ui layers. Use when adding pages, API routes, use cases, Open Finance flows, or extending PF/PJ functionality.
---

# Freenances Feature Workflow

## 1. Define scope

Identify which domain concepts are involved:
- Context (PF/PJ)?
- Transactions, connections, flows, intents, or feed events?
- Read-only page or write flow?

## 2. Domain first (if new rules)

Add to `src/domain/<concept>/types.ts`:
- Constants, types, pure functions
- Domain errors as named classes
- No DB, no React

## 3. Port or use case (if orchestration needed)

**External service** → add method to existing port or new file in `application/ports/`.

**Multi-step workflow** → `application/use-cases/<name>.ts`:
```
fetch session/context → call provider or prisma → map to domain types → side effects (events)
```

## 4. Infrastructure (if new adapter)

Implement port in `infrastructure/`. Include stub fallback for local dev when applicable.

## 5. API route (if HTTP needed)

`src/app/api/<path>/route.ts`:
1. Auth check
2. Zod validation
3. Delegate to use case
4. Return JSON

Register path in `middleware.ts` if protected.

## 6. Page or UI

**Server page** (`app/(app)/<name>/page.tsx`):
- `requireSession()` or rely on layout
- Fetch data in async function
- Map to domain types before UI

**Client interaction** → colocate `"use client"` component (see `connect-bank-button.tsx`).

**UI** → use `ui/primitives` and `ui/patterns`; add to `AppShell` nav if needed.

## 7. Context awareness

If feature is PF or PJ specific:
- Query with `context: { userId, type: "PERSONAL" }` or current context
- Wire `ContextSwitcher` state to page data (today switcher is visual-only — propagate context when implementing)

## 8. Verify locally

```bash
npx prisma db push            # if schema changed (applies to Aiven)
npm run dev
```

For Open Finance features without Pluggy:
1. Connect via `/connections`
2. `curl http://localhost:3000/api/cron/sync`
3. Check `/feed` for synced data

## Checklist

```
- [ ] Domain rules in domain/, not in components
- [ ] API input validated with Zod
- [ ] Auth on protected routes
- [ ] PF/PJ separation respected
- [ ] Stub provider works without Pluggy keys
- [ ] UI uses semantic tokens and existing primitives
- [ ] No secrets in client code
```

## Example: add "revoke connection"

1. `domain/consent/` — add `canRevokeConnection(status)` if needed
2. `application/use-cases/revoke-connection.ts` — call provider, update prisma, create DomainEvent
3. `app/api/open-finance/revoke/route.ts` — POST with connectionId
4. `connections/page.tsx` — Revoke button component
5. `middleware.ts` — protect `/api/open-finance`
