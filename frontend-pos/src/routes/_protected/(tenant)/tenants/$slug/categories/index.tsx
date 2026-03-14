import { createFileRoute } from '@tanstack/react-router';
import { TenantCategoriesPage } from '@/components/tenants/tenant-categories-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/(tenant)/tenants/$slug/categories/')({
  component: TenantCategoriesPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('categories', 'read', 'global');
  },
});
