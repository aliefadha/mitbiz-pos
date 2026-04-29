# 04: Products controller alignment

**Status:** `completed`

## Parent

[PRD: Align Products with Categories Pattern](../PRD.md)

## What to build

Update `ProductsController` mutation endpoints (`POST`, `PUT`, `DELETE`) to return `204 No Content` with `async`/`await`, matching `CategoriesController`. Import `HttpCode` from NestJS and apply `@HttpCode(204)` to create, update, and remove handlers.

No changes to DTOs, permissions, guards, or route decorators. The `GET` endpoints and `findById`'s extra `orders:CREATE` permission remain untouched.

## Acceptance criteria

- [ ] `HttpCode` imported from `@nestjs/common`
- [ ] `@HttpCode(204)` added to `create` (POST), `update` (PUT), and `remove` (DELETE)
- [ ] Mutation handlers converted to `async` with `await` on service calls
- [ ] `GET /products` and `GET /products/:id` unchanged
- [ ] All existing middleware/guards/decorators preserved
- [ ] Controller file passes lint check

## Blocked by

- [03: Products mutations alignment](../issues/03-align-service-mutations.md) — controller awaits service methods that now return void
