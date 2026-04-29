# Write CategoriesService tests

**Status:** `completed`

## Context

Part of: `categories-fixes`

There are no existing service-level unit tests for `CategoriesService`. This work establishes the pattern for future modules.

## Task

1. Create `CategoriesService.spec.ts` using the integration-test style:
   - NestJS `TestingModule`
   - Real `TestDb` instance with `ensureSchemaPushed`
   - `beforeEach` truncation
   - Fixture helpers (`createTenant`, `createCategory`)
   - Mock `TenantAuthService` with `vi.fn()`
2. Cover:
   - `findAll` returns correct product counts per tenant
   - `findAll` search is case-insensitive
   - `findById` returns enriched shape with `tenant` and `productsCount`
   - `create`/`update`/`remove` return `void`
   - `remove` actually sets `isActive: false`
   - Tenant isolation: user from tenant A cannot see/search categories from tenant B

## Acceptance Criteria

- [ ] `CategoriesService.spec.ts` exists and passes
- [ ] Tests verify external behavior, not ORM chain internals
- [ ] E2E tests or controller tests still pass
- [ ] Test database uses the PostgreSQL Docker setup on port 5435
