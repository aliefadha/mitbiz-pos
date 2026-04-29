# 01: Products findAll alignment (TDD)

**Status:** `completed`

## Parent

[PRD: Align Products with Categories Pattern](../PRD.md)

## What to build

Rewrite `ProductsService.findAll` to use explicit column selection with a stock subquery (`COALESCE`), matching the `CategoriesService.findAll` query pattern. The current implementation uses raw `select()` + `leftJoin` on `productStocks` + in-memory Map aggregation, which produces duplicate product rows and incorrect counts.

Retain product-specific behavior: `asc(createdAt)` sort order, extra meta fields (`totalProduk`, `produkAktif`), and product-specific filters (`categoryId`, `outletId`).

Follow TDD: write the spec first, watch it fail, then implement.

## Acceptance criteria

- [ ] Spec written in `products.service.spec.ts` covering findAll: pagination, stock aggregation per outlet, category join, tenant isolation, search, meta stats, and extra filters (categoryId, outletId)
- [ ] `findAll` uses explicit `db.select({...})` with all product columns, not raw `select()`
- [ ] Stock aggregated via subquery with `COALESCE(subquery.quantity, 0)` instead of leftJoin + Map
- [ ] Category name included in response via explicit leftJoin on categories table
- [ ] Sort order remains `asc(products.createdAt)`
- [ ] Meta includes `totalProduk` and `produkAktif` alongside standard pagination fields
- [ ] All service tests pass

## Blocked by

None — can start immediately.
