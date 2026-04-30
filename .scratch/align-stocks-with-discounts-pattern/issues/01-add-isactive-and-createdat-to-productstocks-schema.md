## Parent

`.scratch/align-stocks-with-discounts-pattern/PRD.md`

## What to build

Add `isActive` and `createdAt` columns to the `productStocks` table so that soft-delete semantics and temporal ordering work uniformly across CRUD modules. Run `db:push` to synchronize the schema with the database. No API or test changes are included in this slice — it is pure infrastructure.

## Acceptance criteria

- [ ] `productStocks` schema has `isActive boolean('is_active').default(true).notNull()`
- [ ] `productStocks` schema has `createdAt timestamp('created_at').defaultNow().notNull()`
- [ ] `db:push` succeeds without errors
- [ ] `npm run check -w backend-pos` passes

## Blocked by

None — can start immediately.
