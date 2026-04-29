# Align OutletsService mutations with Categories pattern

**Status:** `completed`

## Context

Part of: `align-outlets-with-categories-pattern`

Mutations return entities via `.returning()`. Switch to `void`.

## Task

1. `create`: Remove `.returning()`, return `Promise<void>`. Keep `kode.toUpperCase()` and uniqueness check.
2. `update`: Remove `.returning()`, return `Promise<void>`. Keep `kode.toUpperCase()` and uniqueness check.
3. `remove`: Remove `.returning()`, remove merged-entity return, return `Promise<void>`.

## Acceptance Criteria

- [ ] All three mutations return `void`
- [ ] Soft-delete still works
- [ ] Kode normalization and uniqueness checks preserved
