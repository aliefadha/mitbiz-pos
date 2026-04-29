# Rewrite Categories findById with explicit joins

**Status:** `completed`

## Context

Part of: `categories-fixes`

`findById` uses Drizzle's relational query API (`db.query.categories.findFirst({ with: { tenant: true } })`). The team prefers explicit SQL joins for single-record enrichment to include computed fields like product count.

## Task

1. Replace relational query with explicit `.select()` + `.leftJoin()`:
   - Join `tenants` table manually
   - Include a product count subquery joined on `categoryId`
2. Return a flat category object with an embedded `tenant` object and `productsCount`.
3. Keep the existing validation flow:
   - Simple existence query first
   - `canAccessTenant` check
   - Then enriched query

## Acceptance Criteria

- [ ] `findById` no longer uses `db.query.categories.findFirst`
- [ ] Returns enriched shape with nested `tenant` and `productsCount`
- [ ] `productsCount` is a real number (not string)
- [ ] Still throws `NotFoundException` and `ForbiddenException` correctly
- [ ] Backend tests verify enriched return shape
