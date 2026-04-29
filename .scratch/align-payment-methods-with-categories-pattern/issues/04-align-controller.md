# Align PaymentMethodsController with Categories pattern

**Status:** `completed`

## Context

Part of: `align-payment-methods-with-categories-pattern`

The controller currently lacks `@HttpCode(204)` and `async`/`await` on mutation endpoints.

## Task

1. Add `@HttpCode(204)` to `create`, `update`, and `remove` endpoints.
2. Add `HttpCode` to the NestJS common imports.
3. Convert `create`, `update`, `remove` handlers to `async` (await the service call).

## Acceptance Criteria

- [ ] `POST /payment-methods` returns `204 No Content`
- [ ] `PATCH /payment-methods/:id` returns `204 No Content`
- [ ] `DELETE /payment-methods/:id` returns `204 No Content`
- [ ] Controller handlers are `async`
- [ ] All existing tests pass
