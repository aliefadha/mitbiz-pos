import { createFileRoute } from '@tanstack/react-router';
import { TenantProductDetailPage } from '@/components/tenants/tenant-product-detail-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/(tenant)/tenants/$slug/products/$productId')({
  component: TenantProductDetailPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('products', 'read', 'tenant');
  },
});
