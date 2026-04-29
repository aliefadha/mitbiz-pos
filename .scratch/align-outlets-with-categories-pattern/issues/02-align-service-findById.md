# Align OutletsService.findById with Categories pattern

**Status:** `completed`

## Context

Part of: `align-outlets-with-categories-pattern`

`findById` uses Drizzle's relational query API. Switch to explicit joins.

## Task

1. Add `tenants` schema import.
2. Implement 2-step pattern:
   - Step 1: minimal existence check (`select { tenantId } ... limit 1`)
   - Step 2: enriched query with `leftJoin(tenants)` and manual `tenant` object shaping
3. Keep existing access validation.

## Acceptance Criteria

- [ ] No longer uses `db.query.outlets.findFirst`
- [ ] Returns nested `tenant` object
- [ ] Exception behavior unchanged
