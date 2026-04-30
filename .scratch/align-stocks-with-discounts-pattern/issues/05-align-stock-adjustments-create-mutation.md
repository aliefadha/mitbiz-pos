## Parent

`.scratch/align-stocks-with-discounts-pattern/PRD.md`

## What to build

Rewrite the stock-adjustments create endpoint to match the discounts module pattern. `create` must return `Promise<void>` with `@HttpCode(204)`. The `adjustedBy` field must be removed from `CreateStockAdjustmentDto` and set server-side from `CurrentUser.id`. UUIDs must be generated in the service layer via `randomUUID()`. Stock adjustments remain immutable — no `DELETE` endpoint is added. Write TDD tests covering void return, stock quantity side effects (incrementing existing stock vs. creating new stock), and auth gating.

## Acceptance criteria

- [ ] `StockAdjustmentsController.create` returns `204 No Content`
- [ ] `StockAdjustmentsService.create` returns `Promise<void>`
- [ ] `CreateStockAdjustmentDto` no longer accepts `adjustedBy`
- [ ] `adjustedBy` is set from `CurrentUser.id` in the service
- [ ] `stock-adjustments.service.spec.ts` has passing tests for create
- [ ] No `DELETE` endpoint exists on `StockAdjustmentsController`
- [ ] `npm run test -w backend-pos` passes for the stock-adjustments module

## Blocked by

None — can start immediately.
