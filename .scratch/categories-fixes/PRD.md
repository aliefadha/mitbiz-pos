# PRD: Categories Module Fixes and API Standardization

**Status:** `completed`

## Problem Statement

The Categories module has several bugs and inconsistencies that affect data correctness, API contract uniformity, and cross-tenant data isolation:

1. **Case-sensitive search**: The `findAll` endpoint uses PostgreSQL `LIKE` for category name search, so queries like `"food"` won't match `"Food"` or `"FOOD"`.
2. **Incorrect product count subquery**: The `findAll` product count subquery uses the raw `tenantId` query parameter instead of the resolved `filterTenantId`. When a tenant-scoped user doesn't pass `tenantId`, the subquery has no tenant filter and counts products across all tenants, inflating counts and leaking cross-tenant data.
3. **Runtime type mismatch for `productsCount`**: `sql<number>` only affects TypeScript. PostgreSQL `count()` returns `bigint`, which `node-postgres` sends back as a string unless cast. The API currently returns `"5"` instead of `5`.
4. **Soft-delete return bug**: The `remove` method spreads the pre-update row over the post-update row (`{ ...category, ...existingCategory }`), so the returned object still shows `isActive: true` as if nothing happened.
5. **Inconsistent API response shapes**: `findById` returns a category with resolved `tenant` relation and rich data, but `create`, `update`, and `remove` return raw insert/update rows with a different shape. The frontend relies on `queryClient.invalidateQueries()` for freshness and doesn't use mutation responses.
6. **ORM query in `findById`**: `findById` uses Drizzle's relational query API (`db.query.categories.findFirst({ with: { tenant: true } })`). The team prefers explicit SQL joins for single-record enrichment to include computed fields like product count.

## Solution

1. Fix `findAll` search to use case-insensitive `ilike`.
2. Fix the product count subquery to use the resolved `filterTenantId`.
3. Cast `productsCount` to integer in SQL (`::integer`) so the API returns real numbers.
4. Fix the `remove` spread order and then make all mutations (`create`, `update`, `remove`) return `void` (HTTP 204) since the frontend doesn't consume the response body.
5. Rewrite `findById` to use explicit `.select()` with `.leftJoin()` for tenant data and a product count subquery, returning a uniform enriched shape.
6. Update the controller to apply `@HttpCode(204)` on mutation endpoints.

## User Stories

1. As a POS operator, I want category searches to be case-insensitive, so that I don't miss results when I type in different casing.
2. As a tenant admin, I want the product count on each category to reflect only products in my tenant, so that I see accurate inventory numbers.
3. As an API consumer, I want `productsCount` to be returned as a real JSON number, not a string, so that my type-safe client doesn't need manual coercion.
4. As a frontend developer, I want mutation endpoints (create, update, delete) to return 204 No Content, so that the API contract is clean and the frontend invalidates caches explicitly.
5. As a frontend developer, I want the category detail endpoint to include a resolved `tenant` object and an accurate `productsCount`, so that the detail page has all data in a single request.
6. As a security reviewer, I want tenant-scoped subqueries to use the same resolved tenant filter as the main query, so that cross-tenant data leakage is prevented.
7. As a developer, I want the `remove` endpoint to return the final post-update state, or nothing at all, so that the response doesn't lie about the row's actual state.
8. As an API consumer, I want all category endpoints to return consistent shapes where enrichment is needed, so that I don't have to handle different schemas for list vs detail vs mutation responses.
9. As a QA engineer, I want the backend tests to verify the exact row count and product count for a given tenant, so that regressions in tenant isolation are caught automatically.
10. As a future maintainer, I want the category service to follow the same join-based query pattern as other services (e.g., ProductsService), so that the codebase is internally consistent.

## Implementation Decisions

- **`findAll` filtering**: Replace `like` with `ilike` for the `nama` search field. This is the standard approach for case-insensitive name matching in PostgreSQL.
- **Subquery tenant scoping**: The product count subquery must use `filterTenantId` (the resolved effective tenant, not the raw query param). This ensures that when a tenant-scoped user queries without an explicit `tenantId`, both the main query and the subquery filter to the same tenant.
- **Integer casting**: Use `COALESCE(subquery.count, 0)::integer` in SQL. This casts the `bigint` result to `integer` at the database level, so `node-postgres` returns a native JavaScript number.
- **Mutation return type**: Change `create`, `update`, and `remove` to return `Promise<void>`. In NestJS, methods returning `void` automatically produce HTTP 204. Apply `@HttpCode(204)` explicitly on the controller methods for clarity.
- **`findById` query strategy**: Replace the Drizzle relational query (`db.query.categories.findFirst({ with: { tenant: true } })`) with explicit `.select()` + `.leftJoin()` queries. Include a product count subquery joined on `categoryId`. This matches the pattern already used in `ProductsService.findAll` and allows computed fields to coexist with relation data.
- **`findById` return shape**: Return a flat category object with an embedded `tenant` object and `productsCount`. This shape is consumed by the frontend's `CategoryDetailPage` and `CategoryInfoCard`.
- **Validation flow in `findById`**: Keep the existing access validation (simple query first, then `canAccessTenant` check, then enriched query). This avoids performing an expensive join before confirming the user has access.
- **Service vs Controller boundaries**: The service owns the data access logic and tenant validation. The controller owns HTTP semantics (status codes, decorators, guards). This separation is preserved.
- **No schema changes**: The existing `categories` and `products` schemas are sufficient. No migrations needed.

## Testing Decisions

- **What makes a good test**: Tests should verify external behavior (HTTP response codes, response shapes, row counts) rather than implementation details (whether a method uses `ilike` vs `like`).
- **Service unit tests**: Write unit tests for `CategoriesService` using Jest with an in-memory or test-database setup. Cover:
  - `findAll` returns correct product counts per tenant
  - `findAll` search is case-insensitive
  - `findById` returns enriched shape with `tenant` and `productsCount`
  - `create`/`update`/`remove` return `void`
  - `remove` actually sets `isActive: false`
  - Tenant isolation: a user from tenant A cannot see/search categories from tenant B
- **E2E tests**: Extend the existing `test/app.e2e-spec.ts` pattern or create a dedicated `categories.e2e-spec.ts`. E2E tests should verify the full request/response cycle through the NestJS app, including guard behavior.
- **Prior art**: The backend currently has `test/app.e2e-spec.ts` using `supertest`. There are no existing service-level unit tests, so this work establishes the pattern for future modules.
- **Test database**: E2E tests should run against the same PostgreSQL Docker setup used in local dev (port 5435), with a fresh schema pushed per test run or per suite.

## Out of Scope

- Fixing similar bugs in other modules (e.g., `ProductsService.remove` has the same spread-order bug). Those should be addressed in follow-up PRs to keep changes reviewable.
- Adding full CRUD tests for categories if it would make the PR too large. Prioritize the bug fixes and the most critical isolation tests.
- Changing frontend code. The frontend already handles 204 responses and invalidates queries after mutations.
- Pagination, sorting, or filtering enhancements beyond the fixes listed.
- Adding search index or full-text search. `ilike` with a `%...%` pattern is sufficient for the current scale.

## Further Notes

- The `ProductsService` already uses `ilike` correctly and performs joins with `.select()` + `.leftJoin()`. The Categories module should align with this pattern.
- The `tenantAuth` service methods (`validateQueryTenantId`, `getEffectiveTenantId`, `canAccessTenant`) are already well-tested through guard usage. Category service tests should treat them as collaborators, either mocking them or relying on the real implementation with seeded test data.
- The `CategoriesModule` exports `CategoriesService`. If other modules consume it directly, verify that the return type changes (`void` on mutations) don't break those callers.
