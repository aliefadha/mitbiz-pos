# Align PaymentMethodsService mutations with Categories pattern

**Status:** `completed`

## Context

Part of: `align-payment-methods-with-categories-pattern`

Mutations (`create`, `update`, `remove`) currently return the mutated entity via `.returning()`. The categories module returns `void`.

## Task

1. **`create`**: Remove `.returning()`, annotate return type as `: Promise<void>`.
2. **`update`**: Remove `.returning()`, annotate return type as `: Promise<void>`.
3. **`remove`**: Remove `.returning()`, remove the merged-entity return (`{ ...existingPaymentMethod, ...paymentMethod }`), annotate as `: Promise<void>`.
4. Keep all tenant authorization and soft-delete logic unchanged.

## Acceptance Criteria

- [ ] `create` returns `Promise<void>`
- [ ] `update` returns `Promise<void>`
- [ ] `remove` returns `Promise<void>`
- [ ] Soft-delete still sets `isActive: false`
- [ ] All existing tests pass (after updating expectations)
