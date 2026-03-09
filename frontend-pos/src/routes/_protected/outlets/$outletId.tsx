import { createFileRoute, redirect } from '@tanstack/react-router';
import { OutletDetailPage } from '@/components/outlets/outlet-detail-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/outlets/$outletId')({
  component: OutletDetailPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('outlets', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
