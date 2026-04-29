# Update PaymentMethodsService tests for new patterns

**Status:** `completed`

## Context

Part of: `align-payment-methods-with-categories-pattern`

The existing tests expect ORM-specific chaining and entity returns. They must be updated to match the new explicit-query, void-return contracts.

## Task

1. Update `findById` test mocks to prime `db.select().from().leftJoin()` chain instead of `db.query.paymentMethods.findFirst`.
2. Update `create` test to expect `undefined` instead of a returned entity.
3. Update `update` test to expect `undefined` instead of `result.nama`.
4. Update `remove` test to expect `undefined` instead of a merged entity with `isActive === false`.
5. Update `findAll` mocks if the explicit-column `select()` path needs different mock priming.

## Acceptance Criteria

- [ ] `findById` tests pass with new query chain
- [ ] `create` test expects void
- [ ] `update` test expects void
- [ ] `remove` test expects void
- [ ] Tests verify external behavior (exceptions, shapes) not internal ORM calls
- [ ] Full test suite passes
