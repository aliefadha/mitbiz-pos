import { createFileRoute } from '@tanstack/react-router';
import { TenantDetailPage } from '@/components/tenants/tenant-detail-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/(tenant)/tenants/$slug/')({
  component: TenantDetailPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('tenants', 'read', 'global');
  },
});
