import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { format } from 'date-fns';
import { StatCardsLaporan } from '@/components/dashboard/stat-cards-laporan';
import { useOrdersPage } from '@/components/orders/hooks';
import { OrderFilters } from '@/components/orders/order-filters';
import { OrderList } from '@/components/orders/order-list';
import { Card, CardContent } from '@/components/ui/card';
import { usePermissions } from '@/hooks/use-auth';
import { checkPermissionWithScope } from '@/lib/permissions';

export function OrdersPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const canReadOutlets = hasPermission('outlet', 'read');
  const canReadDashboards = hasPermission('dashboard', 'read');

  const {
    tenantId,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    outletFilter,
    setOutletFilter,
    dateRange,
    setDateRange,
    outlets,
    orders,
    ordersLoading,
  } = useOrdersPage({ canReadOutlets });

  const formatDate = (date: Date | undefined) => {
    return date ? format(date, 'yyyy-MM-dd') : undefined;
  };

  const handleView = (orderId: string) => {
    navigate({ to: '/orders/$orderId', params: { orderId } });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h4 className="text-lg font-semibold m-0">Riwayat Transaksi</h4>
        <p className="text-sm text-gray-500 m-0">Lihat semua transaksi yang telah dilakukan</p>
      </div>

      {canReadDashboards && (
        <StatCardsLaporan
          tenantId={tenantId}
          outletId={canReadOutlets && outletFilter !== 'all' ? outletFilter : undefined}
          startDate={formatDate(dateRange?.from)}
          endDate={formatDate(dateRange?.to)}
        />
      )}

      <Card className="shadow-sm border-gray-200">
        <CardContent>
          <h4 className="text-base font-semibold mb-6">Daftar Transaksi</h4>

          <OrderFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            outletFilter={outletFilter}
            onOutletChange={setOutletFilter}
            dateRange={dateRange}
            onDateRangeChange={setDateRange}
            outlets={outlets}
            canReadOutlets={canReadOutlets}
          />

          <OrderList orders={orders} isLoading={ordersLoading} onView={handleView} />
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/orders/')({
  component: OrdersPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('orders', 'read', 'tenant');
  },
});
