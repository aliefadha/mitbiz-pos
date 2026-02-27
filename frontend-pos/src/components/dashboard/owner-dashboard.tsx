import { useMemo } from 'react';
import { useTenant } from '@/contexts/tenant-context';
import { SalesByBranchChart } from './sales-by-branch-chart';
import { SalesByPaymentMethodChart } from './sales-by-payment-method-chart';
import { SalesTrendChart } from './sales-trend-chart';
import { StatCards } from './stat-cards';

export function OwnerDashboard() {
  const { selectedTenant, selectedOutlet } = useTenant();

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

      <StatCards
        tenantId={selectedTenant?.id}
        outletId={selectedOutlet?.id}
        startDate={startDate}
        endDate={endDate}
      />

      <SalesTrendChart
        tenantId={selectedTenant?.id}
        outletId={selectedOutlet?.id}
        startDate={startDate}
        endDate={endDate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesByBranchChart
          tenantId={selectedTenant?.id}
          outletId={selectedOutlet?.id}
          startDate={startDate}
          endDate={endDate}
        />
        <SalesByPaymentMethodChart
          tenantId={selectedTenant?.id}
          outletId={selectedOutlet?.id}
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
}
