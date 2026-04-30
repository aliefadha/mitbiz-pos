# 03: Discounts mutations alignment (TDD)

**Status:** `completed`

## Parent

[PRD: Align Discounts with Products Pattern](../PRD.md)

## What to build

Rewrite `DiscountsService.create`, `update`, and `remove` to return `Promise<void>` (no `.returning()`, no merged-entity return). All discount-specific domain logic stays intact: tenant-scoped validation and product association management on create/update.

Follow TDD: extend the spec, watch tests fail, then implement.

## Acceptance criteria

- [ ] Spec extended with tests for create, update, remove
- [ ] `create`: returns `undefined`, validates tenant operation via `tenantAuth.validateTenantOperation`, inserts discount, inserts product associations when `productIds` provided
- [ ] `update`: returns `undefined`, manages product associations (delete old `discountProducts` + insert new), calls `findById` internally for tenant access check
- [ ] `remove`: returns `undefined`, soft-deletes (`isActive: false`), calls `findById` internally for tenant access check
- [ ] `remove` test verifies `isActive` is actually `false` in the database
- [ ] All mutation tests expect `undefined` return value, not entity objects
- [ ] All service tests pass

## Blocked by

- [02: Discounts findById alignment](../issues/02-align-service-findById.md) — update and remove call findById internally for tenant access validation
