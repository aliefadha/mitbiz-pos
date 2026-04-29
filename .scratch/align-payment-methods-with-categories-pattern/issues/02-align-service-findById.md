# Align PaymentMethodsService.findById with Categories pattern

**Status:** `completed`

## Context

Part of: `align-payment-methods-with-categories-pattern`

`findById` currently uses Drizzle's relational query API (`db.query.paymentMethods.findFirst({ with: { tenant: true } })`). The team prefers explicit joins.

## Task

1. Add `tenants` schema import for the left join.
2. Replace relational query with a 2-step pattern:
   - **Step 1**: Minimal existence check via `db.select({ tenantId }).from(paymentMethods).where(eq(id)).limit(1)`
   - **Step 2**: Enriched query via `db.select({...}).from(paymentMethods).leftJoin(tenants, ...).where(eq(id)).limit(1)`
3. Manually shape the nested `tenant` object in the return value (match `CategoriesService.findById` shape).
4. Keep existing tenant access validation flow.

## Acceptance Criteria

- [ ] `findById` no longer uses `db.query.paymentMethods.findFirst`
- [ ] Returns manually shaped object with nested `tenant` field
- [ ] Still throws `NotFoundException` when missing
- [ ] Still throws `ForbiddenException` when tenant access is denied
- [ ] All existing tests pass (after updating mocks)
