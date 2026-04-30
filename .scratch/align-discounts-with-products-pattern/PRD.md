# PRD: Align Discounts with Products Pattern

**Status:** `completed`

## Problem Statement

The `discounts` module still uses the old CRUD style that `products` has already moved away from. It relies on Drizzle's relational query API (`db.query.discounts.findFirst({ with: {...} })`), raw `select()` without explicit columns, case-sensitive `like()` for search, and mutation methods that return entities via `.returning()`. The controller mutation endpoints lack `@HttpCode(204)` and `async`/`await`. This inconsistency makes it harder for developers to onboard new modules, because they cannot copy a single reliable pattern.

Additionally, the `discounts` query DTO accepts an `outletId` parameter, but the `findAll` service method never applies it as a filter — the parameter is silently ignored.

## Solution

Align the `discounts` service, controller, and tests to match the structural patterns established by the `products` module, while preserving discount-specific domain logic (product association management via the `discountProducts` join table, outlet-scoping behavior, and `scope`/`level` enums).

The frontend already invalidates queries and refetches after mutations, so returning `void` from mutations has no consumer impact.

## User Stories

1. As a backend developer, I want all CRUD services to follow the same structural patterns, so that I can onboard new modules quickly without guessing which style to copy.

2. As a backend developer, I want `findAll` to use explicit column selection instead of raw `select()`, so that the query is deterministic about what data it exposes.

3. As a backend developer, I want `findAll` search to use `ilike` (case-insensitive) instead of `like` (case-sensitive), so that search behavior is consistent with `products` and `categories`.

4. As a backend developer, I want the `outletId` query parameter in `findAll` to actually filter discounts by outlet, so that the API contract matches the implementation.

5. As a backend developer, I want `findById` to use a fail-fast + explicit join pattern (existence check → tenant access check → enriched query), so that unauthorized access is rejected before expensive joins are executed.

6. As a backend developer, I want `findById` to return nested `tenant` and `outlet` objects alongside the full associated `products` array, so that the response is self-contained for order creation flows.

7. As a cashier, I want to be able to view discount details via `findById` while creating an order, so that I can verify which products a discount applies to before applying it to a transaction.

8. As a backend developer, I want mutation endpoints (`create`, `update`, `remove`) to return `204 No Content` instead of the created/updated entity, so that API consumers can rely on uniform response semantics across modules.

9. As a backend developer, I want mutation methods to return `Promise<void>` without `.returning()`, so that the database doesn't perform unnecessary post-mutation selects.

10. As a backend developer, I want the `remove` (soft-delete) method to follow the same simple void pattern as create/update instead of returning a merged entity, so that all mutations have identical contracts.

11. As a developer, I want product association management to remain on discount create/update, so that linking discounts to products continues to work.

12. As a backend developer, I want tests to verify external behavior (return shapes, thrown exceptions, side effects) rather than ORM chaining details, so that tests survive query-style refactors.

## Implementation Decisions

### Modules to modify

| Module | Change |
|--------|--------|
| `DiscountsService` | Structural rewrite to match `ProductsService` patterns |
| `DiscountsController` | Add `@HttpCode(204)` and `async`/`await` on mutations; add `orders:CREATE` permission on `findById` |
| `DiscountsService.spec.ts` | Write new spec following `ProductsService.spec.ts` structure |

### Service — specific changes

1. **`findAll`**: Replace raw `db.select()` with explicit column selection for every `discounts` column. Switch search from `like()` to `ilike()`. Apply `outletId` as a WHERE condition when provided. Keep `asc(createdAt)` ordering. Return standard pagination shape (`{ data, meta }`).

2. **`findById`**: Replace Drizzle relational query API with a 3-step pattern:
   - First: minimal existence check via `db.select({ tenantId }).from(discounts).where(eq(id)).limit(1)`
   - Second: tenant access check via `tenantAuth.canAccessTenant`
   - Third: enriched query with explicit `db.select({...}).from(discounts).leftJoin()` on `tenants`, `outlets`, and a subquery/join for associated `products` — manually shaping nested `tenant`, `outlet`, and `products` objects in the return value.

3. **`create`**: Remove `.returning()`, annotate `: Promise<void>`. Keep tenant validation via `tenantAuth.validateTenantOperation`. Keep product association insertion into `discountProducts` when `productIds` are provided.

4. **`update`**: Remove `.returning()`, annotate `: Promise<void>`. Keep product association management (delete old `discountProducts` + insert new). Keep `tenantAuth` validation indirectly via the `findById` call which checks tenant access.

5. **`remove`**: Remove `.returning()`, remove the merged-entity return, annotate `: Promise<void>`. Keep the `findById` call for tenant access validation. Keep soft-delete semantics (`isActive: false`).

### Controller — specific changes

6. Add `@HttpCode(204)` and `HttpCode` import on `create`, `update`, `remove` endpoints, matching `ProductsController` and `CategoriesController`.

7. Convert `create`, `update`, `remove` handlers to `async` (await the service call), matching `ProductsController`.

8. Add `@Permission('orders', [Action.CREATE])` on the `findById` endpoint, matching the `products` module's behavior for cashier access during order creation.

### What stays the same

- DTO schemas (no schema changes)
- Module definition (no wiring changes)
- Permission guards and decorators (except the added `orders:CREATE` on `findById`)
- Tenant authorization logic (already identical in pattern)
- Soft-delete semantics (`isActive: false`)
- Pagination shape (`{ data, meta }`)
- `asc(createdAt)` sort order in `findAll`
- Product association management on create/update
- Discount-specific fields (`scope`, `level`, `rate`)
- Outlet-scoping behavior (`outletId` nullable)

## Testing Decisions

### What makes a good test here

Tests should verify **external behavior** — return shapes, thrown exception types, pagination math, auth gating, outlet filtering, and product association correctness — not whether a specific ORM method was called. The `products.service.spec.ts` and `categories.service.spec.ts` are the prior art.

### Test approach

Use **TDD** (red-green-refactor) via the `tdd` skill. Write spec first, watch it fail, then implement the service changes.

### What tests should cover

- `findAll`: pagination, explicit column return shape, tenant isolation (data leakage prevention across tenants), tenant isolation when filtering by `outletId`, case-insensitive search, `outletId` filtering, sort order
- `findById`: enriched shape (tenant + outlet + products), not-found, forbidden tenant access
- `create`: returns void, validates tenant operation, inserts discount, inserts product associations when provided, throws `ForbiddenException` when user operates on unauthorized tenant
- `update`: returns void, manages product associations (delete old + insert new), calls `findById` for tenant access
- `remove`: returns void, soft-deletes (`isActive: false`) in database, throws on nonexistent

### Test infrastructure

Same setup as `products.service.spec.ts`: `TestDb` from `test/helpers/database.helper`, `createMockTenantAuth`, fixtures from `test/helpers/fixtures.helper`.

## Out of Scope

- Schema or migration changes
- Frontend changes (the frontend already handles void responses correctly)
- Extracting a shared CRUD base class or abstract service
- Changing the `products`, `categories`, or any other already-aligned module
- Adding new discount features or endpoints
- Changing the `discounts` module structure beyond the three files (service, controller, spec)

## Further Notes

- `discounts` is the last remaining CRUD module not yet aligned with the explicit query + void mutation pattern. `products`, `categories`, `payment-methods`, and `outlets` have already been aligned.
- The `findAll` ordering (`asc(createdAt)`) is a deliberate divergence from `categories` (which uses `desc(createdAt)`), but it aligns with `products` and is confirmed as the desired behavior.
- The `outletId` filter in `findAll` fixes a latent bug: the parameter was accepted by the DTO but never applied in the service query.
- The `findById` endpoint's new `@Permission('orders', [Action.CREATE])` enables cashiers to inspect discount details (including linked products) while building transactions.
- The frontend `useDiscountsPage` hook already calls `queryClient.invalidateQueries({ queryKey: ['discounts'] })` after successful create/update/delete, so void mutation returns require zero frontend changes.

(End of file)
