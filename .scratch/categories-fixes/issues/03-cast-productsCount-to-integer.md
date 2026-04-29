# Cast productsCount to integer in Categories queries

**Status:** `completed`

## Context

Part of: `categories-fixes`

PostgreSQL `count()` returns `bigint`, which `node-postgres` sends back as a string unless cast. The API currently returns `"5"` instead of `5` for `productsCount`.

## Task

1. In `CategoriesService.findAll` and `CategoriesService.findById`, cast the product count subquery to integer:
   - Use `COALESCE(subquery.count, 0)::integer` in SQL
2. Ensure TypeScript types reflect `number` (not `string`).

## Acceptance Criteria

- [ ] `productsCount` is returned as a JSON number (`5`), not a string (`"5"`)
- [ ] TypeScript types are correct
- [ ] Backend tests verify numeric return type
