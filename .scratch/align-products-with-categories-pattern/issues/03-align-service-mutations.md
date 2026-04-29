# 03: Products mutations alignment (TDD)

**Status:** `completed`

## Parent

[PRD: Align Products with Categories Pattern](../PRD.md)

## What to build

Rewrite `ProductsService.create`, `update`, and `remove` to return `Promise<void>` (no `.returning()`, no merged-entity return). All product-specific domain logic stays intact: SKU uniqueness check, category reference validation, tenant-scoped category check, and discount association management on update.

Follow TDD: extend the spec, watch tests fail, then implement.

## Acceptance criteria

- [ ] Spec extended with tests for create, update, remove
- [ ] `create`: returns `undefined`, validates SKU uniqueness (throws `ConflictException` on duplicate SKU in same tenant), validates category exists and belongs to same tenant, validates tenant operation via `tenantAuth.validateTenantOperation`
- [ ] `update`: returns `undefined`, validates SKU uniqueness only when SKU changed, validates category only when categoryId changed, manages discount associations (delete old `discountProducts` + insert new), calls `findById` internally for tenant access check
- [ ] `remove`: returns `undefined`, soft-deletes (`isActive: false`), calls `findById` internally for tenant access check
- [ ] `remove` test verifies `isActive` is actually `false` in the database
- [ ] All mutation tests expect `undefined` return value, not entity objects
- [ ] All service tests pass

## Blocked by

- [02: Products findById alignment](../issues/02-align-service-findById.md) — update and remove call findById internally for tenant access validation
