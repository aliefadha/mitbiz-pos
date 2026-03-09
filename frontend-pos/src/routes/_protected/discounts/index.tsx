import { createFileRoute, redirect } from '@tanstack/react-router';
import { DiscountPage } from '@/components/discounts/discount-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/discounts/')({
  component: DiscountPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('discounts', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
