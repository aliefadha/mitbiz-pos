import { createFileRoute, useParams } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { CashShiftInfoCard } from '@/components/cash-shifts/cash-shift-info-card';
import { CashShiftOrdersList } from '@/components/cash-shifts/cash-shift-orders-list';
import { useCashShiftDetail } from '@/components/cash-shifts/hooks';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-auth';

const formatRupiah = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

function CashShiftDetailPage() {
  const { cashShiftId } = useParams({ from: '/_protected/(tenant)/cash-shifts/$cashShiftId' });
  const { hasPermission } = usePermissions();

  const canReadOrders = hasPermission('orders', 'read');

  const {
    cashShift,
    orders,
    ordersMeta,
    totalPenjualan,
    isLoading,
    ordersLoading,
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
  } = useCashShiftDetail(cashShiftId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!cashShift) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Shift tidak ditemukan</p>
        <Button variant="link" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h4 className="text-lg font-semibold m-0">Detail Shift Kasir</h4>
          <p className="text-sm text-gray-500 m-0">Lihat detail shift kasir</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <CashShiftInfoCard cashShift={cashShift} />

        <Card>
          <CardContent>
            <h5 className="font-semibold mb-4">Ringkasan Kas</h5>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah Buka</span>
                <span className="font-medium">{formatRupiah(cashShift.jumlahBuka)}</span>
              </div>
              {canReadOrders && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Penjualan</span>
                  <span className="font-medium">{formatRupiah(totalPenjualan)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Jumlah Tutup</span>
                <span className="font-medium">
                  {cashShift.status === 'tutup' ? formatRupiah(cashShift.jumlahTutup) : '-'}
                </span>
              </div>
              {cashShift.status === 'tutup' && (
                <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
                  <span>Selisih</span>
                  <span
                    className={
                      parseFloat(cashShift.selisih) > 0
                        ? 'text-green-600'
                        : parseFloat(cashShift.selisih) < 0
                          ? 'text-red-600'
                          : ''
                    }
                  >
                    {formatRupiah(cashShift.selisih)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {canReadOrders && (
        <CashShiftOrdersList
          orders={orders}
          isLoading={ordersLoading}
          currentPage={currentPage}
          pageSize={pageSize}
          total={ordersMeta?.total ?? 0}
          totalPages={ordersMeta?.totalPages ?? 0}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
        />
      )}
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/cash-shifts/$cashShiftId')({
  component: CashShiftDetailPage,
});
