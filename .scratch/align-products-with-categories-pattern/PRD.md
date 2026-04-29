# PRD: Align Products with Categories Pattern

**Status:** `completed`

## Problem Statement

The `products` module diverges from the established `categories` module pattern across query style, mutation return types, join strategy, controller HTTP codes, and test structure. Every other module (`categories`, `payment-methods`, `outlets`) now follows the same pattern — `products` is the last holdout.

## Solution

Align the `products` service, controller, and tests to match the `categories` module pattern in structure — retaining product-specific domain logic (SKU validation, discount management, stock aggregation, extra meta stats).

## User Stories

1. As a backend developer, I want all CRUD services to follow the same structural patterns, so that I can onboard new modules quickly without guessing which style to copy.

2. As a backend developer, I want `findAll` to use explicit column selection + a stock subquery with `COALESCE` instead of raw `select()` + `leftJoin` + in-memory Map aggregation, so that the query is deterministic and produces correct row counts.

3. As a backend developer, I want `findById` to use explicit `db.select({...})` with manual left-joins instead of Drizzle's relational `findFirst({ with })` API, so that all read operations are explicit about what columns they expose and fail-fast on unauthorized access.

4. As a backend developer, I want mutation endpoints (`create`, `update`, `remove`) to return `204 No Content` instead of the created/updated entity, so that API consumers can rely on uniform response semantics across modules.

5. As a backend developer, I want mutation methods to return `Promise<void>` without `.returning()`, so that the database doesn't perform unnecessary post-mutation selects.

6. As a backend developer, I want the `remove` (soft-delete) method to follow the same simple void pattern as create/update instead of returning a merged entity, so that all mutations have identical contracts.

7. As a frontend developer, I want product `findAll` to continue returning `totalProduk` and `produkAktif` in meta alongside the standard pagination fields, so the frontend dashboard still gets aggregate counts.

8. As a frontend developer, I want the `findAll` product list to remain sorted oldest-first (ascending by `createdAt`), so that the POS terminal shows products in a stable list order.

9. As a frontend developer, I want `findById` on products to remain accessible to users with `orders:CREATE` permission, so that cashiers can view product details while creating transactions.

10. As a backend developer, I want tests to verify external behavior (return shapes, thrown exceptions, side effects) rather than ORM chaining details, so that tests survive query-style refactors.

11. As a developer, I want SKU uniqueness validation and category reference validation to remain on product create/update, so that data integrity rules specific to products are preserved.

12. As a developer, I want discount association management to remain on product update, so that linking products to discounts continues to work.

## Implementation Decisions

### Modules to modify

| Module | Change |
|--------|--------|
| `ProductsService` | Structural rewrite to match `CategoriesService` |
| `ProductsController` | Add `@HttpCode(204)` and `async`/`await` on mutations |
| `ProductsService.spec.ts` | Write new spec following Categories spec structure |

### Service — specific changes

1. **`findAll`**: Replace raw `db.select()` + `leftJoin(productStocks)` + in-memory Map aggregation with explicit column selection and a stock subquery using `COALESCE(...)`. Keep `asc(createdAt)` ordering. Keep the extra stats query for `totalProduk`/`produkAktif`.

2. **`findById`**: Replace `db.query.products.findFirst({ with: { tenant, category, discountProducts } })` with a 3-step pattern:
   - First: minimal existence check via `db.select({ tenantId }).from(products).where(eq(id)).limit(1)`
   - Second: tenant access check via `tenantAuth.canAccessTenant`
   - Third: enriched query with explicit `db.select({...}).from(products).leftJoin()` on tenants, categories, and a stock subquery — manually shaping nested `tenant`, `category`, and `discounts` objects in the return value.

3. **`create`**: Remove `.returning()`, annotate `: Promise<void>`. Keep SKU uniqueness check and category validation (existence + tenant match). Keep `tenantAuth.validateTenantOperation`.

4. **`update`**: Remove `.returning()`, annotate `: Promise<void>`. Keep SKU uniqueness check (only if SKU changed), category validation (only if categoryId changed), and discount association management (delete old + insert new). Keep `tenantAuth.validateTenantOperation` indirectly via the `findById` call which checks tenant access.

5. **`remove`**: Remove `.returning()`, remove the merged-entity return, annotate `: Promise<void>`. Keep the `findById` call for tenant access validation.

### Controller — specific changes

6. Add `@HttpCode(204)` and `HttpCode` import on `create`, `update`, `remove` endpoints, matching `CategoriesController`.

7. Convert `create`, `update`, `remove` handlers to `async` (await the service call), matching `CategoriesController`.

### What stays the same

- DTO schemas (no schema changes)
- Module definition (no wiring changes)
- Permission guards and decorators
- `@Permission('orders', [Action.CREATE])` on `findById` endpoint
- Tenant authorization logic (already identical in both services)
- Soft-delete semantics (`isActive: false`)
- Pagination shape (`{ data, meta }`)
- `asc(createdAt)` sort order in `findAll`
- `totalProduk` and `produkAktif` in meta
- SKU uniqueness validation on create/update
- Category reference validation on create/update
- Discount association management on update
- Product-specific query filters (`categoryId`, `outletId`)

## Testing Decisions

### What makes a good test here

Tests should verify **external behavior** — return shapes, thrown exception types, pagination math, auth gating, stock aggregation correctness — not whether a specific ORM method was called. The `categories.service.spec.ts` is the prior art.

### Test approach

Use **TDD** (red-green-refactor) via the `tdd` skill. Write spec first, watch it fail, then implement the service changes.

### What tests should cover

- `findAll`: pagination, stock aggregation per outlet, category join, tenant isolation, search, meta stats
- `findById`: enriched shape (tenant + category + discounts), not-found, forbidden tenant access
- `create`: returns void, validates SKU uniqueness, validates category existence, validates tenant operation
- `update`: returns void, validates SKU uniqueness on change, validates category on change, manages discount associations
- `remove`: returns void, sets `isActive: false` in database, throws on nonexistent

### Test infrastructure

Same setup as `categories.service.spec.ts`: `TestDb` from `test/helpers/database.helper`, `createMockTenantAuth`, fixtures from `test/helpers/fixtures.helper`.

## Out of Scope

- Schema or migration changes
- Frontend changes
- Extracting a shared CRUD base class or abstract service
- Changing the `categories` module or any other already-aligned module
- Adding new product features or endpoints
- Changing the `products` module structure beyond the three files (service, controller, spec)

## Further Notes

- `ProductsService` is the last CRUD module not yet aligned with the categories pattern. `payment-methods` and `outlets` have already been aligned.
- The stock subquery in `findAll` must aggregate quantities per product across all outlets, similar to how categories aggregates product counts. The current in-memory Map approach is a bug: `leftJoin` on `productStocks` produces duplicate product rows (one per outlet), inflating the count. The subquery approach fixes this.
- The `findAll` ordering (`asc`) and extra meta fields (`totalProduk`, `produkAktif`) are deliberate product-level divergences confirmed by the developer — not oversights.
- The `@Permission('orders', [Action.CREATE])` on `findById` is a deliberate product-level divergence — cashiers need product detail access while building orders.
- The `update` method's discount management (delete old discountProducts + insert new) is product-specific domain logic independent of the structural pattern and stays unchanged in behavior.
