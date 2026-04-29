# Fix case-insensitive search in Categories findAll

**Status:** `completed`

## Context

Part of: `categories-fixes`

The `findAll` endpoint uses PostgreSQL `LIKE` for category name search, so queries like `"food"` won't match `"Food"` or `"FOOD"`.

## Task

1. Replace `like` with `ilike` for the `nama` search field in `CategoriesService.findAll`.
2. Update imports: add `ilike`, remove unused `like` if no longer needed elsewhere.

## Acceptance Criteria

- [ ] Searching `"food"` returns categories named `"Food"`, `"FOOD"`, `"food"`
- [ ] No regression on non-search queries
- [ ] Backend tests verify case-insensitivity
