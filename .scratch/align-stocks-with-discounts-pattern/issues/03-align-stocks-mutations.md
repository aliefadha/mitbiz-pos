## Parent

`.scratch/align-stocks-with-discounts-pattern/PRD.md`

## What to build

Rewrite the stocks mutation endpoints to match the discounts module pattern. `create`, `update`, and `remove` must return `Promise<void>` with `@HttpCode(204)`. UUIDs must be generated in the service layer via `randomUUID()`. `remove` must soft-delete by setting `isActive = false` instead of hard-deleting. Add `isActive` as an optional field in `UpdateStockDto`. Remove the unused `adjustQuantity` method. Write TDD tests covering void returns, conflict on duplicate product+outlet, soft-delete state verification, and auth gating.

## Acceptance criteria

- [ ] `StocksController.create`, `update`, `remove` return `204 No Content`
- [ ] `StocksService.create`, `update`, `remove` return `Promise<void>`
- [ ] `StocksService.remove` soft-deletes (`isActive = false`)
- [ ] `UpdateStockDto` includes optional `isActive` field
- [ ] `adjustQuantity` method is removed from `StocksService`
- [ ] `stocks.service.spec.ts` has passing tests for create, update, and remove
- [ ] `npm run test -w backend-pos` passes for the stocks module

## Blocked by

- `01-add-isactive-and-createdat-to-productstocks-schema.md`
