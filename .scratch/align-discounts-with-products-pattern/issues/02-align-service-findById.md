# 02: Discounts findById alignment (TDD)

**Status:** `completed`

## Parent

[PRD: Align Discounts with Products Pattern](../PRD.md)

## What to build

Rewrite `DiscountsService.findById` to use the fail-fast + explicit join pattern from `ProductsService.findById`. Replace Drizzle's relational query API (`db.query.discounts.findFirst({ with: {...} })`) with a 3-step approach: minimal existence check → tenant access check → enriched query with explicit `leftJoin` and manual response shaping.

Retain the product association data (full product columns), add nested `tenant` and `outlet` objects.

Follow TDD: extend the spec, watch it fail, then implement.

## Acceptance criteria

- [ ] Spec extended with findById tests: enriched shape (tenant + outlet + products), not-found, forbidden tenant access
- [ ] Step 1: minimal existence check via `db.select({ tenantId }).from(discounts).where(eq(id)).limit(1)`
- [ ] Step 2: tenant access check via `tenantAuth.canAccessTenant` BEFORE the enriched query
- [ ] Step 3: enriched query with explicit `leftJoin` on tenants, outlets, and product associations
- [ ] Response manually shaped: flat discount object with nested `tenant`, `outlet`, and `products` arrays
- [ ] Throws `NotFoundException` when discount doesn't exist
- [ ] Throws `ForbiddenException` when user can't access the discount's tenant
- [ ] All service tests pass

## Blocked by

- [01: Discounts findAll alignment](../issues/01-align-service-findAll.md) — test infrastructure (TestDb, mock TenantAuth, fixtures) established there
