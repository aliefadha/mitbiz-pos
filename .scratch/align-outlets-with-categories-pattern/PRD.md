## Problem Statement

The `outlets` module was implemented independently and diverges from the established pattern in the `categories` module across query style, mutation return types, search semantics, controller HTTP codes, and test structure. The `payment-methods` module was already aligned with `categories` via a prior PRD; `outlets` is the next module that needs the same treatment to prevent inconsistency from spreading further.

## Solution

Align the `outlets` service, controller, and tests to match the `categories` module pattern exactly in structure — apart from domain-specific logic (e.g., `totalOutlet` / `outletAktif` / `outletNonaktif` stats in `findAll` meta, and the `kode` uniqueness check which are inherently outlet-only).

## User Stories

1. As a backend developer, I want all CRUD services to follow the same structural patterns, so that I can onboard new modules quickly without guessing which style to copy.

2. As a backend developer, I want mutation endpoints to consistently return `204 No Content` instead of the created/updated entity, so that API consumers can rely on uniform response semantics.

3. As a backend developer, I want `findById` to use explicit `db.select({...})` with manual left-joins instead of Drizzle's relational `findFirst({ with })` API, so that all read operations are explicit about what columns they expose.

4. As a backend developer, I want `findAll` to use explicit column selection instead of wildcard `select()`, so that adding a computed column later doesn't require a full rewrite.

5. As a backend developer, I want search to use `ilike` (case-insensitive) consistently across all modules, so that users searching "jakarta" find "Jakarta" regardless of casing.

6. As a backend developer, I want mutation methods (`create`, `update`, `remove`) to return `Promise<void>` without `.returning()`, so that the database doesn't perform unnecessary post-mutation selects.

7. As a backend developer, I want the `remove` (soft-delete) method to follow the same simple void pattern as create/update instead of returning a merged entity, so that all mutations have identical contracts and I avoid bugs where the merged object silently overwrites the soft-delete flag.

8. As a backend developer, I want tests to verify external behavior (return shape, exceptions, side effects) rather than implementation details of the ORM query chain, so that tests survive refactors of the query style.

9. As a backend developer, I want the `outlets` module to have the same test coverage as `categories`, so that regressions in tenant auth, pagination, or mutation behavior are caught before they reach production.

## Implementation Decisions

### Modules to modify

| Module | Change |
|--------|--------|
| `OutletsService` | Structural rewrite to match `CategoriesService` |
| `OutletsController` | Add `@HttpCode(204)` and `async`/`await` on mutations |
| `OutletsService.spec.ts` | New integration-style test file mirroring `CategoriesService.spec.ts` |
| `fixtures.helper.ts` | Add `createOutlet` helper for test data setup |

### Service — specific changes

1. **`findAll`**: Replace wildcard `.select()` with explicit column pick listing all columns on the `outlets` table (`id`, `tenantId`, `nama`, `kode`, `alamat`, `noHp`, `isActive`, `createdAt`, `updatedAt`). Keep the existing stats subquery (`totalOutlet`, `outletAktif`, `outletNonaktif`) in `meta` — this is domain-specific logic, not structural pattern.

2. **`findById`**: Replace `db.query.outlets.findFirst({ with: { tenant: true } })` with a 2-step pattern:
   - First: minimal existence check via `db.select({ tenantId }).from(outlets).where(eq(id)).limit(1)`
   - Second: enriched query via `db.select({...}).from(outlets).leftJoin(tenants, ...).where(eq(id)).limit(1)` — with manually shaped nested `tenant` object in the return value.

3. **`create`**: Remove `.returning()`, annotate `: Promise<void>`. Keep the existing `kode.toUpperCase()` and kode-uniqueness check — this is domain-specific.

4. **`update`**: Remove `.returning()`, annotate `: Promise<void>`. Keep the existing `kode.toUpperCase()` and kode-uniqueness check.

5. **`remove`**: Remove `.returning()`, remove the merged-entity return (`{ ...existingOutlet, ...outlet }`), annotate `: Promise<void>`. This fixes a latent bug where `existingOutlet.isActive: true` overwrites `outlet.isActive: false`.

6. **Search**: Replace `like` import/usage with `ilike`.

7. **Imports**: Add `tenants` schema import (needed for explicit left-join in `findById`). Add `and`, `eq` for conditions. Remove unused `like`.

### Controller — specific changes

8. Add `@HttpCode(204)` and `HttpCode` import on `create`, `update`, `remove` endpoints, matching `CategoriesController`.

9. Convert `create`, `update`, `remove` handlers to `async` (await the service call), matching `CategoriesController`.

### What stays the same

- DTO schemas (no schema changes)
- Module definition (no wiring changes)
- Permission guards and decorators
- Tenant authorization logic (already identical in both services)
- Soft-delete semantics (`isActive: false`)
- Pagination shape (`{ data, meta: { page, limit, total, totalPages, totalOutlet, outletAktif, outletNonaktif } }`)
- `kode` uppercase normalization and uniqueness validation

## Testing Decisions

### What makes a good test here

Tests should verify **external behavior**, not ORM chaining details: return shapes, thrown exception types, pagination math, auth gating, and meta field presence. They should not assert on whether `db.query.outlets.findFirst` or `db.select().from().leftJoin()` was called.

### Test infrastructure

Use the same pattern as `CategoriesService.spec.ts`: a NestJS `TestingModule` with a real `TestDb` instance, `ensureSchemaPushed`, `beforeEach` truncation, and fixture helpers (`createTenant`, `createOutlet`). Mock `TenantAuthService` with `vi.fn()` to control tenant-access behavior.

### What tests need to cover

- `findAll`: pagination, tenant filtering, search, empty results, meta shape including stats fields
- `findById`: happy path with nested tenant, `NotFoundException`, `ForbiddenException`
- `create`: void return, `ForbiddenException` on invalid tenant, kode uniqueness rejection
- `update`: void return, `NotFoundException`, kode uniqueness rejection
- `remove`: void return, `NotFoundException`, soft-delete side effect

### Prior art

`CategoriesService.spec.ts` and `PaymentMethodsService.spec.ts` both use this integration-test style with `TestDb` and fixture helpers.

## Out of Scope

- Unifying additional modules beyond `outlets` (e.g., `products`, `cashShifts`, etc.)
- Extracting a shared CRUD base class or abstract service
- Changing the `categories` module in any way
- Schema or migration changes
- Frontend changes (the frontend already consumes `totalOutlets` and `outletAktif` from `meta`)

## Further Notes

- `CategoriesService` has a `productsCount` aggregated field (via subquery + leftJoin). `OutletsService` has no analogous cross-table count, but it *does* have `totalOutlet` / `outletAktif` / `outletNonaktif` in `meta` from a separate stats query. These stats stay because the frontend's `OutletStats` component depends on them — they are domain-specific, not structural.
- `CategoriesService.findById` returns a manually shaped `tenant` nested object. `OutletsService.findById` previously relied on Drizzle relations to auto-nest `tenant`. After alignment, it will manually shape the nested object the same way categories does.
- The `remove` method currently returns `{ ...outlet, ...existingOutlet }`, which accidentally overwrites the soft-deleted `isActive: false` with the pre-update `isActive: true`. Switching to `Promise<void>` eliminates this bug.
- The controller currently lacks `async`/`await` and `@HttpCode(204)` on mutations. With `Promise<void>` returns, NestJS will send a `201 Created` or `200 OK` body by default unless `@HttpCode(204)` is added — matching categories prevents silently changing HTTP status codes for existing API consumers.

**Status:** `needs-triage`
