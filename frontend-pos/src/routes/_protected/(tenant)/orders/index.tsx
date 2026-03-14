import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { StatCardsLaporan } from '@/components/dashboard/stat-cards-laporan';
import { useOrdersPage } from '@/components/orders/hooks';
import { OrderFilters } from '@/components/orders/order-filters';
import { OrderList } from '@/components/orders/order-list';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-auth';
import { useSession } from '@/lib/auth-client';
import { checkPermissionWithScope } from '@/lib/permissions';

export function OrdersPage() {
  const navigate = useNavigate();
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;
  const { hasPermission } = usePermissions();

  const canReadOutlets = hasPermission('outlet', 'read');

  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    outletFilter,
    setOutletFilter,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    outlets,
    orders,
    ordersLoading,
  } = useOrdersPage({ canReadOutlets });

  const handleView = (orderId: string) => {
    navigate({ to: '/orders/$orderId', params: { orderId } });
  };

  if (ordersLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h4 className="text-lg font-semibold m-0">Riwayat Transaksi</h4>
        <p className="text-sm text-gray-500 m-0">Lihat semua transaksi yang telah dilakukan</p>
      </div>

      <StatCardsLaporan
        tenantId={tenantId}
        outletId={canReadOutlets && outletFilter !== 'all' ? outletFilter : undefined}
        startDate={startDate}
        endDate={endDate}
      />

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
            startDate={startDate}
            onStartDateChange={setStartDate}
            endDate={endDate}
            onEndDateChange={setEndDate}
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
