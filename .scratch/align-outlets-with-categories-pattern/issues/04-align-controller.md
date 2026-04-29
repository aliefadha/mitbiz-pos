# Align OutletsController with Categories pattern

**Status:** `completed`

## Context

Part of: `align-outlets-with-categories-pattern`

Controller lacks `@HttpCode(204)` and `async`/`await` on mutations.

## Task

1. Add `@HttpCode(204)` to `create`, `update`, `remove`.
2. Import `HttpCode`.
3. Convert mutation handlers to `async`.

## Acceptance Criteria

- [ ] All mutation endpoints return `204 No Content`
- [ ] Handlers are `async`
