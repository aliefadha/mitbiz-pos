# Align OutletsService.findAll with Categories pattern

**Status:** `completed`

## Context

Part of: `align-outlets-with-categories-pattern`

`findAll` currently uses wildcard `.select()`. Align it with the explicit column selection pattern.

## Task

1. Replace wildcard `.select()` with explicit columns:
   - `id`, `tenantId`, `nama`, `kode`, `alamat`, `noHp`, `isActive`, `createdAt`, `updatedAt`
2. Replace `like` with `ilike` for case-insensitive search.
3. Keep existing stats subquery (`totalOutlet`, `outletAktif`, `outletNonaktif`) in `meta`.
4. Update imports: add `and`, `eq`, `ilike`; remove unused `like`.

## Acceptance Criteria

- [ ] Explicit column selection in `findAll`
- [ ] `ilike` search
- [ ] Stats meta preserved
- [ ] Pagination shape unchanged
