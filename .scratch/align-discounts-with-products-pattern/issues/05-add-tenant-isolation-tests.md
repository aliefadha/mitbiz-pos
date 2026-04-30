# 05: Add tenant isolation tests to discounts spec

**Status:** `completed`

## Parent

[PRD: Align Discounts with Products Pattern](../PRD.md)

## What to build

Add 3 missing tenant isolation tests to `DiscountsService.spec.ts`, following the patterns established in `categories.service.spec.ts` and `products.service.spec.ts`. The service and controller alignment is already implemented — this issue is test-only coverage for tenant boundaries that the other aligned modules already verify.

Update all existing issue statuses (01-04) to `completed` and refresh the PRD testing section to include the new tenant isolation coverage.

## Acceptance criteria

- [ ] `findAll` test "should isolate discounts by tenant": creates discounts on two tenants, mocks effective tenant ID, verifies only own tenant's discounts are returned
- [ ] `findAll` test "should isolate discounts by tenant when filtering by outletId": creates outlet-scoped discounts on two tenants with same outlet ID, filters by `outletId`, verifies tenant boundary is respected
- [ ] `create` test "should throw ForbiddenException when user cannot operate in target tenant": mocks `validateTenantOperation` to reject, verifies `ForbiddenException` is thrown
- [ ] Issues 01-04 status updated to `completed`
- [ ] PRD testing section updated with new tenant isolation test coverage
- [ ] All service tests pass
- [ ] `npm run check -w backend-pos` passes

## Blocked by

None — can start immediately.
