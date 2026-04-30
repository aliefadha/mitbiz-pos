# PRD: Align Stocks and Stock-Adjustments with Discounts Pattern

**Status:** `needs-triage`

## Problem Statement

The `stocks` and `stock-adjustments` modules diverge from the established `discounts` module pattern across query style, mutation return types, join strategy, controller HTTP codes, test structure, and schema completeness. The `discounts` module is the most mature CRUD module in the codebase and serves as the canonical reference for how services, controllers, and tests should be structured.

The `stocks` module currently:
- Returns entities from mutations instead of `204 No Content`
- Hard-deletes records instead of soft-deleting
- Uses a single-query `findById` instead of the two-step pattern (existence → gate → enriched query)
- Has no `createdAt` field and no `isActive` field on its schema
- Has no service test coverage
- Has no `@Permission('orders', [Action.CREATE])` fallback on read endpoints

The `stock-adjustments` module currently:
- Returns entities from mutations instead of `204 No Content`
- Has no `DELETE` endpoint (which is correct for an audit log, but we should codify this)
- Uses Drizzle relational queries (`findFirst({ with })`) instead of explicit joins in `findById`
- Has no service test coverage
- Has no `@Permission('orders', [Action.CREATE])` fallback on read endpoints
- Accepts `adjustedBy` in the create DTO, which should be server-set from `CurrentUser`

## Solution

Align both modules to the `discounts` pattern in structure, HTTP semantics, test coverage, and authorization. Preserve domain-specific behavior (stock quantity side effects on adjustment creation, stock adjustment immutability).

## User Stories

1. As a backend developer, I want all CRUD services to follow the same structural patterns, so that I can onboard new modules quickly without guessing which style to copy.

2. As a backend developer, I want `stocks` mutation endpoints (`create`, `update`, `remove`) to return `204 No Content` instead of the created/updated/deleted entity, so that API consumers can rely on uniform response semantics across modules.

3. As a backend developer, I want `stock-adjustments` mutation endpoints to return `204 No Content`, so that API consumers can rely on uniform response semantics across modules.

4. As a backend developer, I want `stocks.remove` to soft-delete (`isActive = false`) instead of hard-deleting, so that historical stock records remain traceable and the pattern matches other CRUD modules.

5. As a backend developer, I want `stock-adjustments` to remain immutable (no update, no delete endpoints), so that the audit trail is tamper-proof and reconcilable with the stock ledger.

6. As a backend developer, I want `findById` in both services to use the two-step pattern (minimal existence check → tenant gate → enriched explicit joins), so that all read operations are explicit about what columns they expose and fail-fast on unauthorized access.

7. As a backend developer, I want `stocks.findAll` to use explicit `db.select()` with manual joins instead of Drizzle relational queries, so that column exposure is explicit and consistent with the discounts pattern.

8. As a backend developer, I want both read endpoints to accept `['orders', [Action.CREATE]]` as a secondary permission, so that cashiers can view stock and adjustment details while creating transactions.

9. As a backend developer, I want the `stock-adjustments` create DTO to stop accepting `adjustedBy`, so that the server sets the acting user from `CurrentUser` and clients cannot spoof audit attribution.

10. As a backend developer, I want `stocks` to have an `isActive` field and a `createdAt` field, so that soft-delete semantics and temporal ordering work uniformly.

11. As a developer, I want both services to have comprehensive `.service.spec.ts` tests written via TDD, so that behavior is verified and refactors are safe.

12. As a backend developer, I want UUIDs for new records to be generated in the service layer (via `randomUUID()`) rather than relying on DB defaults, so that the application controls identity assignment.

## Implementation Decisions

### Modules to modify

| Module | Change |
|--------|--------|
| `StocksService` | Structural rewrite to match `DiscountsService` |
| `StocksController` | Add `@HttpCode(204)` and `async`/`await` on mutations; add secondary permissions |
| `StockAdjustmentsService` | Structural rewrite to match `DiscountsService` |
| `StockAdjustmentsController` | Add `@HttpCode(204)` and `async`/`await` on create; add secondary permissions; remove `adjustedBy` from DTO |
| `productStocks` schema | Add `isActive boolean default true` and `createdAt timestamp defaultNow()` |

### Stocks Service — specific changes

1. **`findAll`**: Use explicit `db.select()` with manual `leftJoin` on `products`, `categories`, and `outlets`. Keep pagination shape `{ data, meta }`. Keep `desc(updatedAt)` ordering. Keep tenant filtering via `getProductIdsByTenant`.

2. **`findById`**: Switch to two-step pattern:
   - First: minimal existence check via `db.select({ id, productId }).from(productStocks).where(eq(id)).limit(1)`
   - Second: tenant access check via `tenantAuth.canAccessTenant` using the product's tenant
   - Third: enriched query with explicit `db.select({...}).from(productStocks).leftJoin()` on products, categories, outlets — manually shaping nested objects

3. **`create`**: Remove `.returning()`, annotate `: Promise<void>`. Generate UUID via `randomUUID()`. Keep product existence check, outlet existence check, tenant match validation, and duplicate-stock conflict check.

4. **`update`**: Remove `.returning()`, annotate `: Promise<void>`. Validate tenant access via `findById` first, then perform the update.

5. **`remove`**: Remove `.returning()`, annotate `: Promise<void>`. Validate tenant access via `findById` first, then soft-delete (`isActive = false`).

6. **Delete `adjustQuantity`**: This method is unused and should be removed.

### Stock-Adjustments Service — specific changes

1. **`findAll`**: Keep `db.query.stockAdjustments.findMany({ with: { product, outlet, user } })` with pagination — this is already clean, but ensure tenant filtering is explicit via outlet subquery (matching the discounts pattern of filtering through a related table).

2. **`findById`**: Switch to two-step pattern:
   - First: minimal existence check via `db.select({ id, outletId }).from(stockAdjustments).where(eq(id)).limit(1)`
   - Second: tenant access check via `tenantAuth.canAccessTenant` using the outlet's tenant
   - Third: enriched query with explicit `db.select({...}).from(stockAdjustments).leftJoin()` on products, outlets, and user

3. **`create`**: Remove `.returning()`, annotate `: Promise<void>`. Generate UUID via `randomUUID()`. Set `adjustedBy` from `CurrentUser.id` (not from DTO). Keep product/outlet existence checks and tenant match validation. Keep the side effect of updating/creating `productStocks` quantity.

4. **No `remove`**: Stock adjustments are immutable audit records. Do not add a `remove` method or endpoint.

### Stocks Controller — specific changes

- Add `@HttpCode(204)` and `HttpCode` import on `create`, `update`, `remove`.
- Convert `create`, `update`, `remove` handlers to `async` (await the service call).
- Add `@Permission('orders', [Action.CREATE])` as secondary permission on `findAll` and `findById`.

### Stock-Adjustments Controller — specific changes

- Add `@HttpCode(204)` and `HttpCode` import on `create`.
- Convert `create` handler to `async`.
- Add `@Permission('orders', [Action.CREATE])` as secondary permission on `findAll` and `findById`.
- Do NOT add a `DELETE` endpoint.

### DTO changes

- `CreateStockAdjustmentSchema`: remove `adjustedBy` field.
- `UpdateStockSchema`: add `isActive` as an optional boolean field.

### Schema changes

- `productStocks` table: add `isActive boolean('is_active').default(true).notNull()` and `createdAt timestamp('created_at').defaultNow().notNull()`.
- `stockAdjustments` table: no changes needed (immutable audit log; `createdAt` already exists).

## Testing Decisions

### What makes a good test here

Tests should verify **external behavior** — return shapes, thrown exception types, pagination math, auth gating, soft-delete state, stock quantity side effects — not whether a specific ORM method was called. The `discounts.service.spec.ts` is the prior art.

### Test approach

Use **TDD** (red-green-refactor) via the `tdd` skill. Write one spec at a time, watch it fail, then implement the minimal code to pass.

### Stocks service tests

- `findAll`: pagination, tenant isolation, filtering by `productId` and `outletId`, empty results
- `findById`: enriched shape (product + category + outlet), `NotFoundException`, `ForbiddenException`
- `create`: returns void, creates record, throws `ConflictException` on duplicate product+outlet, throws `NotFoundException` for missing product/outlet, throws `ForbiddenException` for tenant mismatch
- `update`: returns void, updates quantity, throws `NotFoundException`, throws `ForbiddenException`
- `remove`: returns void, sets `isActive = false`, throws `NotFoundException`, throws `ForbiddenException`

### Stock-adjustments service tests

- `findAll`: pagination, tenant isolation, filtering by `productId`, `outletId`, and `adjustedBy`, empty results
- `findById`: enriched shape (product + outlet + user), `NotFoundException`, `ForbiddenException`
- `create`: returns void, creates adjustment and increments existing stock, creates adjustment and creates new stock when none exists, throws `NotFoundException` for missing product/outlet, throws `ForbiddenException` for tenant mismatch

### Test infrastructure

Same setup as `discounts.service.spec.ts`: `TestDb` from `test/helpers/database.helper`, `createMockTenantAuth`, fixtures from `test/helpers/fixtures.helper`.

## Out of Scope

- Extracting a shared CRUD base class or abstract service
- Changing the `discounts` module or any other already-aligned module
- Adding new stock features (e.g., stock transfers, stock alerts)
- Frontend changes
- Changing the immutability of stock adjustments (they remain immutable)
- Adding `updatedAt` to `stockAdjustments` (it is immutable)

## Further Notes

- `stock-adjustments` is intentionally treated differently from `stocks` on deletion: stock adjustments are an audit log (domain events), whereas stocks are configuration/state. The discounts pattern is applied structurally, but the immutability decision is domain-driven.
- The stock quantity side effect in `StockAdjustmentsService.create` (updating `productStocks.quantity`) is product-specific domain logic independent of the structural pattern and stays unchanged in behavior.
- The `findAll` sort order for stocks is `desc(updatedAt)` (most recently changed first), which differs from discounts' `asc(createdAt)`. This is a deliberate UX choice for inventory management and is not changed.
