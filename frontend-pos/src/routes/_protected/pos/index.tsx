import { createFileRoute, redirect } from '@tanstack/react-router';
import { PosPage } from '@/components/orders/pos-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/pos/')({
  component: PosPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('orders', 'create');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
