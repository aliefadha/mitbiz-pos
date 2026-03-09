import { createFileRoute, redirect } from '@tanstack/react-router';
import { StockPage } from '@/components/stocks/stock-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/stocks/')({
  component: StockPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('stocks', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
