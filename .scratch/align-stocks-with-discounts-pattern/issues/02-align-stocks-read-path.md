## Parent

`.scratch/align-stocks-with-discounts-pattern/PRD.md`

## What to build

Rewrite the stocks read path to match the discounts module pattern. `findAll` must use explicit `db.select()` with manual `leftJoin` on products, categories, and outlets. `findById` must switch to the two-step pattern: minimal existence check → tenant access gate → enriched explicit query. Add `['orders', CREATE]` as a secondary permission on both `GET /stocks` and `GET /stocks/:id`. Write TDD tests covering pagination, tenant isolation, filtering by `productId` and `outletId`, enriched response shapes, `NotFoundException`, and `ForbiddenException`.

## Acceptance criteria

- [ ] `StocksService.findAll` uses explicit `db.select()` with manual joins
- [ ] `StocksService.findById` uses two-step pattern (existence → gate → enriched query)
- [ ] `StocksController` read endpoints have `['orders', [Action.CREATE]]` secondary permission
- [ ] `stocks.service.spec.ts` exists and passes with tests for findAll and findById
- [ ] `npm run test -w backend-pos` passes for the stocks module

## Blocked by

- `01-add-isactive-and-createdat-to-productstocks-schema.md`
