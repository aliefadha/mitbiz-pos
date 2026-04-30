## Parent

`.scratch/align-stocks-with-discounts-pattern/PRD.md`

## What to build

Rewrite the stock-adjustments read path to match the discounts module pattern. `findById` must switch to the two-step pattern: minimal existence check → tenant access gate → enriched explicit query with manual joins on products, outlets, and user. Add `['orders', CREATE]` as a secondary permission on both `GET /stock-adjustments` and `GET /stock-adjustments/:id`. Write TDD tests covering pagination, tenant isolation, filtering by `productId`, `outletId`, and `adjustedBy`, enriched response shapes, `NotFoundException`, and `ForbiddenException`.

## Acceptance criteria

- [ ] `StockAdjustmentsService.findById` uses two-step pattern with explicit joins
- [ ] `StockAdjustmentsController` read endpoints have `['orders', [Action.CREATE]]` secondary permission
- [ ] `stock-adjustments.service.spec.ts` exists and passes with tests for findAll and findById
- [ ] `npm run test -w backend-pos` passes for the stock-adjustments module

## Blocked by

None — can start immediately.
