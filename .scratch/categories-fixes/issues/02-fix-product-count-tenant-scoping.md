# Fix product count subquery tenant scoping in Categories findAll

**Status:** `completed`

## Context

Part of: `categories-fixes`

The `findAll` product count subquery uses the raw `tenantId` query parameter instead of the resolved `filterTenantId`. When a tenant-scoped user doesn't pass `tenantId`, the subquery has no tenant filter and counts products across all tenants, inflating counts and leaking cross-tenant data.

## Task

1. In `CategoriesService.findAll`, ensure the product count subquery uses `filterTenantId` (the resolved effective tenant ID) instead of the raw `tenantId` query parameter.
2. Verify that both the main query and the subquery filter to the same tenant.

## Acceptance Criteria

- [ ] Product count reflects only products in the resolved tenant
- [ ] Tenant-scoped user without explicit `tenantId` param sees correct counts for their tenant
- [ ] Backend tests verify exact row count and product count per tenant
- [ ] No cross-tenant data leakage
