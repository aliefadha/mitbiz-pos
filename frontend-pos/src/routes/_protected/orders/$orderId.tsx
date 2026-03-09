import { createFileRoute, redirect } from '@tanstack/react-router';
import { OrderDetailPage } from '@/components/orders/order-detail-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/orders/$orderId')({
  component: OrderDetailPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('orders', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
