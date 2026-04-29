# Add createOutlet fixture helper

**Status:** `completed`

## Context

Part of: `align-outlets-with-categories-pattern`

Tests need a helper to seed outlet test data, just like `createTenant` and `createCategory`.

## Task

1. Add `createOutlet` helper to the test fixtures/helper file.
2. Helper should accept `TestDb` and outlet fields, return the created outlet row.

## Acceptance Criteria

- [ ] `createOutlet` helper exists
- [ ] Used by `OutletsService.spec.ts`
- [ ] Helper follows the same pattern as `createTenant`/`createCategory`
