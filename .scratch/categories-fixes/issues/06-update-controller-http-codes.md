# Update CategoriesController HTTP codes for mutations

**Status:** `completed`

## Context

Part of: `categories-fixes`

With mutations now returning `void`, we should explicitly apply `@HttpCode(204)` on mutation endpoints for clarity and consistency.

## Task

1. Add `@HttpCode(204)` to `create`, `update`, and `remove` endpoints in `CategoriesController`.
2. Add `HttpCode` to NestJS common imports if not already present.

## Acceptance Criteria

- [ ] `POST /categories` returns `204 No Content`
- [ ] `PATCH /categories/:id` returns `204 No Content`
- [ ] `DELETE /categories/:id` returns `204 No Content`
- [ ] All existing tests pass
