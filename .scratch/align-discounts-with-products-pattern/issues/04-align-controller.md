# 04: Discounts controller alignment

**Status:** `completed`

## Parent

[PRD: Align Discounts with Products Pattern](../PRD.md)

## What to build

Update `DiscountsController` mutation endpoints (`POST`, `PUT`, `DELETE`) to return `204 No Content` with `async`/`await`, matching `ProductsController`. Import `HttpCode` from NestJS and apply `@HttpCode(204)` to create, update, and remove handlers.

Add `@Permission('orders', [Action.CREATE])` on `findById` to enable cashier access during order creation.

No changes to DTOs, guards, or route decorators beyond the added permission. The `GET` endpoints remain untouched.

## Acceptance criteria

- [ ] `HttpCode` imported from `@nestjs/common`
- [ ] `@HttpCode(204)` added to `create` (POST), `update` (PUT), and `remove` (DELETE)
- [ ] Mutation handlers converted to `async` with `await` on service calls
- [ ] `@Permission('orders', [Action.CREATE])` added to `findById`
- [ ] `GET /discounts` and `GET /discounts/:id` otherwise unchanged
- [ ] All existing middleware/guards/decorators preserved
- [ ] Controller file passes lint check

## Blocked by

- [03: Discounts mutations alignment](../issues/03-align-service-mutations.md) — controller awaits service methods that now return void
