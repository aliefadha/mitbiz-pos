import { createFileRoute, redirect } from '@tanstack/react-router';
import { StockAdjustmentPage } from '@/components/stock-adjustments/stock-adjustment-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/stock-adjustment/')({
  component: StockAdjustmentPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('stockAdjustments', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
