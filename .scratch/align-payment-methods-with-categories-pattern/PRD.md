# PRD: Align Payment Methods with Categories Pattern

**Status:** `completed`

## Problem Statement

The `payment-methods` module was implemented independently and diverges from the established pattern in the `categories` module across query style, mutation return types, search semantics, controller HTTP codes, and test structure. Every future CRUD module risks repeating this inconsistency.

## Solution

Align the `payment-methods` service, controller, and tests to match the `categories` module pattern exactly in structure — apart from domain-specific logic (e.g., `productsCount` subquery which is inherently category-only).

## User Stories

1. As a backend developer, I want all CRUD services to follow the same structural patterns, so that I can onboard new modules quickly without guessing which style to copy.

2. As a backend developer, I want mutation endpoints to consistently return `204 No Content` instead of the created/updated entity, so that API consumers can rely on uniform response semantics.

3. As a backend developer, I want `findById` to use explicit `db.select({...})` with manual left-joins instead of Drizzle's relational `findFirst({ with })` API, so that all read operations are explicit about what columns they expose.

4. As a backend developer, I want `findAll` to use explicit column selection instead of wildcard `select()`, so that adding a computed column later (e.g., usage count) doesn't require a full rewrite.

5. As a backend developer, I want search to use `ilike` (case-insensitive) consistently across all modules, so that users searching "cash" find "Cash" regardless of casing.

6. As a backend developer, I want mutation methods (`create`, `update`, `remove`) to return `Promise<void>` without `.returning()`, so that the database doesn't perform unnecessary post-mutation selects.

7. As a backend developer, I want the `remove` (soft-delete) method to follow the same simple void pattern as create/update instead of returning a merged entity, so that all mutations have identical contracts.

8. As a backend developer, I want tests to verify external behavior (return shape, exceptions, side effects) rather than implementation details of the ORM query chain, so that tests survive refactors of the query style.

## Implementation Decisions

### Modules to modify

| Module | Change |
|--------|--------|
| `PaymentMethodsService` | Structural rewrite to match `CategoriesService` |
| `PaymentMethodsController` | Add `@HttpCode(204)` and `async`/`await` on mutations |
| `PaymentMethodsService.spec.ts` | Update mocks and expectations for new return shapes |

### Service — specific changes

1. **`findAll`**: Replace wildcard `.select()` with explicit column pick listing all columns on the `payment_methods` table (`id`, `tenantId`, `nama`, `isActive`, `createdAt`, `updatedAt`).

2. **`findById`**: Replace `db.query.paymentMethods.findFirst({ with: { tenant: true } })` with a 2-step pattern:
   - First: minimal existence check via `db.select({ tenantId }).from(paymentMethods).where(eq(id)).limit(1)`
   - Second: enriched query via `db.select({...}).from(paymentMethods).leftJoin(tenants, ...).where(eq(id)).limit(1)` — with manually shaped nested `tenant` object in the return value.

3. **`create`**: Remove `.returning()`, annotate `: Promise<void>`.

4. **`update`**: Remove `.returning()`, annotate `: Promise<void>`.

5. **`remove`**: Remove `.returning()`, remove the merged-entity return (`{ ...existingPaymentMethod, ...paymentMethod }`), annotate `: Promise<void>`.

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
- Pagination shape (`{ data, meta: { page, limit, total, totalPages } }`)

## Testing Decisions

### What makes a good test here

Tests should verify **external behavior**, not ORM chaining details: return shapes, thrown exception types, pagination math, and auth gating. They should not assert on whether `db.query.paymentMethods.findFirst` or `db.select().from().leftJoin()` was called.

### What tests need updating

- `findById` tests: The mock currently primes `mockDb.query.paymentMethods.findFirst`. It must be updated to prime the explicit `select`/`from`/`leftJoin` chain instead.
- `create` test: Currently expects the returned entity object; must expect `undefined`.
- `update` test: Currently expects `result.nama` on the returned entity; must expect `undefined`.
- `remove` test: Currently expects a merged entity with `result.isActive === false`; must expect `undefined`.
- `findAll` tests: The explicit-column `select()` path may need mock adjustment, though the chain-based mock may already handle it.

### Test structure

Existing spec already uses a proper NestJS `TestingModule` with `jest.fn()` mocks for `DB_CONNECTION` and `TenantAuthService`. Keep this test infrastructure. Modify the mock helper to support `leftJoin` in the query chain and update return-value expectations.

## Out of Scope

- Unifying additional modules beyond `payment-methods` (e.g., `products`, `outlets`, etc.)
- Extracting a shared CRUD base class or abstract service
- Changing the `categories` module in any way
- Schema or migration changes
- Frontend changes

## Further Notes

- `CategoriesService` has a `productsCount` aggregated field (via subquery + leftJoin on `findAll` and `findById`). `PaymentMethodsService` has no analogous cross-table count, so that subquery is not replicated — this is domain logic, not structural pattern.
- `CategoriesService.findById` returns a manually shaped `tenant` nested object. `PaymentMethodsService.findById` previously relied on Drizzle relations to auto-nest `tenant`. After alignment, it will manually shape the nested object the same way categories does.
- The controller currently lacks `async`/`await` and `@HttpCode(204)` on mutations. With `Promise<void>` returns, NestJS will send a `201 Created` or `200 OK` body by default unless `@HttpCode(204)` is added — matching categories prevents silently changing HTTP status codes for existing API consumers.
