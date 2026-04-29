# Write OutletsService tests

**Status:** `completed`

## Context

Part of: `align-outlets-with-categories-pattern`

Create a new `OutletsService.spec.ts` mirroring `CategoriesService.spec.ts`.

## Task

1. Create `OutletsService.spec.ts` with:
   - NestJS `TestingModule`
   - Real `TestDb`, `ensureSchemaPushed`, `beforeEach` truncation
   - Mock `TenantAuthService`
2. Cover:
   - `findAll`: pagination, tenant filtering, search, empty results, meta stats
   - `findById`: happy path, `NotFoundException`, `ForbiddenException`
   - `create`: void return, `ForbiddenException`, kode uniqueness
   - `update`: void return, `NotFoundException`, kode uniqueness
   - `remove`: void return, `NotFoundException`, soft-delete side effect

## Acceptance Criteria

- [ ] `OutletsService.spec.ts` exists and passes
- [ ] Tests verify external behavior
