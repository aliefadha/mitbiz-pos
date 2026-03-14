import { createFileRoute } from '@tanstack/react-router';
import { NewProductPage } from '@/components/tenants/new-product-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/(tenant)/tenants/$slug/products/new')({
  component: NewProductPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('products', 'create', 'global');
  },
});
