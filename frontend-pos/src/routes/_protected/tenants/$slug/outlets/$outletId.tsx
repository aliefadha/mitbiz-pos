import { createFileRoute } from '@tanstack/react-router';
import { OutletDetailPage } from '@/components/outlets/outlet-detail-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/tenants/$slug/outlets/$outletId')({
  component: OutletDetailPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('outlets', 'read', 'global');
  },
});
