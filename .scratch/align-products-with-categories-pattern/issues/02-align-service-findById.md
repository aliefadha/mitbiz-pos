# 02: Products findById alignment (TDD)

**Status:** `completed`

## Parent

[PRD: Align Products with Categories Pattern](../PRD.md)

## What to build

Rewrite `ProductsService.findById` to use the fail-fast + explicit join pattern from `CategoriesService.findById`. Replace Drizzle's relational query API (`db.query.products.findFirst({ with: {...} })`) with a 3-step approach: minimal existence check → tenant access check → enriched query with explicit `leftJoin` and manual response shaping.

Retain the `@Permission('orders', [Action.CREATE])` on the controller endpoint.

Follow TDD: extend the spec, watch it fail, then implement.

## Acceptance criteria

- [ ] Spec extended with findById tests: enriched shape (tenant + category + discounts), not-found, forbidden tenant access
- [ ] Step 1: minimal existence check via `db.select({ tenantId }).from(products).where(eq(id)).limit(1)`
- [ ] Step 2: tenant access check via `tenantAuth.canAccessTenant` BEFORE the enriched query
- [ ] Step 3: enriched query with explicit `leftJoin` on tenants, categories, and a stock subquery
- [ ] Response manually shaped: flat object with nested `tenant`, `category`, `discounts` objects
- [ ] Throws `NotFoundException` when product doesn't exist
- [ ] Throws `ForbiddenException` when user can't access the product's tenant
- [ ] All service tests pass

## Blocked by

- [01: Products findAll alignment](../issues/01-align-service-findAll.md) — test infrastructure (TestDb, mock TenantAuth, fixtures) established there
