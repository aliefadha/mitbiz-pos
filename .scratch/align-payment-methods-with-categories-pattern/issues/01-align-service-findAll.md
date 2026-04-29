# Align PaymentMethodsService.findAll with Categories pattern

**Status:** `completed`

## Context

Part of: `align-payment-methods-with-categories-pattern`

The `payment-methods` module uses wildcard `.select()` in `findAll`, diverging from the explicit column selection pattern established in `categories`.

## Task

1. Replace wildcard `.select()` with explicit column pick listing all columns on the `payment_methods` table:
   - `id`, `tenantId`, `nama`, `isActive`, `createdAt`, `updatedAt`
2. Replace `like` import/usage with `ilike` for case-insensitive search.
3. Add `and`, `eq` imports as needed for conditions.
4. Remove unused `like` import.
5. Ensure pagination shape stays: `{ data, meta: { page, limit, total, totalPages } }`

## Acceptance Criteria

- [ ] `findAll` uses explicit `db.select({ id: ..., tenantId: ..., nama: ..., isActive: ..., createdAt: ..., updatedAt: ... })`
- [ ] Search uses `ilike` instead of `like`
- [ ] All existing tests pass (after updating mocks if needed)
- [ ] No schema changes
