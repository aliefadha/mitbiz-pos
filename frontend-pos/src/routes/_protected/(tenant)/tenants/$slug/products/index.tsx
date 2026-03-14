import { createFileRoute } from '@tanstack/react-router';
import { TenantProductsPage } from '@/components/tenants/tenant-products-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/(tenant)/tenants/$slug/products/')({
  component: TenantProductsPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('products', 'read', 'tenant');
  },
});
