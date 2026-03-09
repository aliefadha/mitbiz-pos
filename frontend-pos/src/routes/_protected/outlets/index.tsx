import { createFileRoute, redirect } from '@tanstack/react-router';
import { OutletPage } from '@/components/outlets/outlet-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/outlets/')({
  component: OutletPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('outlets', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
