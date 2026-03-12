import { createFileRoute } from '@tanstack/react-router';
import { useMemo } from 'react';
import { SalesByBranchChart } from '@/components/dashboard/sales-by-branch-chart';
import { SalesByPaymentMethodChart } from '@/components/dashboard/sales-by-payment-method-chart';
import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart';
import { StatCards } from '@/components/dashboard/stat-cards';
import { ErrorPage } from '@/components/error-page';
import { ForbiddenPage } from '@/components/forbidden-page';
import { checkPermission, ForbiddenError } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/dashboard')({
  component: DashboardPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('dashboard', 'read');
    if (!allowed) {
      throw new ForbiddenError('dashboard');
    }
  },
  errorComponent: ({ error }) => {
    if (error instanceof ForbiddenError) {
      return <ForbiddenPage resource={error.resource} />;
    }
    return <ErrorPage reset={() => window.location.reload()} />;
  },
});

function DashboardPage() {
  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      startDate: thirtyDaysAgo.toISOString().split('T')[0],
      endDate: now.toISOString().split('T')[0],
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      <div>
        <h1 className="text-lg font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview dan statistik bisnis</p>
      </div>

      <StatCards startDate={startDate} endDate={endDate} />

      <SalesTrendChart startDate={startDate} endDate={endDate} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesByBranchChart startDate={startDate} endDate={endDate} />
        <SalesByPaymentMethodChart startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
}
