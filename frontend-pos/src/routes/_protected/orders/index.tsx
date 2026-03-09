import { createFileRoute, redirect } from '@tanstack/react-router';
import { OrderPage } from '@/components/orders/order-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/orders/')({
  component: OrderPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('orders', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
