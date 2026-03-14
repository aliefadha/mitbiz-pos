import { createFileRoute } from '@tanstack/react-router';
import { TenantOutletsPage } from '@/components/tenants/tenant-outlets-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/(tenant)/tenants/$slug/outlets/')({
  component: TenantOutletsPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('outlets', 'read', 'tenant');
  },
});
