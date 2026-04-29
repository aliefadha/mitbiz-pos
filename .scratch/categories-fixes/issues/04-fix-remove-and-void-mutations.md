# Fix remove spread order and void all mutation returns

**Status:** `completed`

## Context

Part of: `categories-fixes`

1. The `remove` method spreads the pre-update row over the post-update row (`{ ...category, ...existingCategory }`), so the returned object still shows `isActive: true` as if nothing happened.
2. The frontend relies on `queryClient.invalidateQueries()` for freshness and doesn't use mutation responses, so all mutations should return `void` (HTTP 204) for consistency.

## Task

1. Fix the spread order in `remove` so the post-update state is returned (as a temporary fix).
2. Then change `create`, `update`, and `remove` to return `Promise<void>`:
   - Remove `.returning()` from all three
   - Annotate return types as `: Promise<void>`
3. Keep soft-delete semantics (`isActive: false`) in `remove`.

## Acceptance Criteria

- [ ] `create` returns `void`
- [ ] `update` returns `void`
- [ ] `remove` returns `void`
- [ ] `remove` actually sets `isActive: false` in the database
- [ ] Backend tests verify void returns and soft-delete side effect
