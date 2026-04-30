# 01: Discounts findAll alignment (TDD)

**Status:** `completed`

## Parent

[PRD: Align Discounts with Products Pattern](../PRD.md)

## What to build

Rewrite `DiscountsService.findAll` to use explicit column selection, matching the `ProductsService.findAll` query pattern. The current implementation uses raw `select()` and `like()` (case-sensitive), and ignores the `outletId` query parameter.

Retain discount-specific behavior: `asc(createdAt)` sort order, `scope`/`level` enum fields, and the standard pagination shape.

Follow TDD: write the spec first, watch it fail, then implement.

## Acceptance criteria

- [ ] Spec written in `discounts.service.spec.ts` covering findAll: pagination, explicit column return shape, tenant isolation, case-insensitive search, outletId filtering, sort order
- [ ] `findAll` uses explicit `db.select({...})` with all discount columns, not raw `select()`
- [ ] Search uses `ilike` instead of `like` for case-insensitive matching
- [ ] `outletId` query parameter is applied as a WHERE condition when provided
- [ ] Sort order remains `asc(discounts.createdAt)`
- [ ] Standard pagination meta (`page`, `limit`, `total`, `totalPages`)
- [ ] All service tests pass

## Blocked by

None — can start immediately.
