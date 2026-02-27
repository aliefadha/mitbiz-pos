import { useQuery } from '@tanstack/react-query';
import { useParams, useNavigate } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cashShiftsApi, type CashShift } from '@/lib/api/cash-shifts';
import { ordersApi, type Order } from '@/lib/api/orders';

interface CashShiftDetail extends CashShift {
  orders?: Order[];
}

export function CashShiftDetailPage() {
  const { cashShiftId } = useParams({ from: '/_protected/cash-shifts/$cashShiftId' });
  const navigate = useNavigate();

  const { data: cashShiftData, isLoading: cashShiftLoading } = useQuery({
    queryKey: ['cash-shift', cashShiftId],
    queryFn: () => cashShiftsApi.getById(cashShiftId),
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'by-cash-shift', cashShiftId],
    queryFn: () => ordersApi.getAll({ cashShiftId }),
    enabled: !!cashShiftId,
  });

  const cashShift = cashShiftData as CashShiftDetail | undefined;
  const orders = ordersData?.data ?? [];

  const formatRupiah = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'buka':
        return 'bg-green-100 text-green-700';
      case 'tutup':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'buka':
        return 'Buka';
      case 'tutup':
        return 'Tutup';
      default:
        return status;
    }
  };

  if (cashShiftLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!cashShift) {
    return <div>Shift tidak ditemukan</div>;
  }

  const totalPenjualan = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

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
        <div className="rounded-lg border bg-white p-6">
          <h5 className="font-semibold mb-4">Informasi Shift</h5>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Status</span>
              <span
                className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(
                  cashShift.status
                )}`}
              >
                {getStatusLabel(cashShift.status)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Outlet</span>
              <span className="font-medium">{cashShift.outlet?.nama || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Kasir</span>
              <span className="font-medium">{cashShift.cashier?.name || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Waktu Buka</span>
              <span className="font-medium">{formatDate(cashShift.openedAt)}</span>
            </div>
            {cashShift.closedAt && (
              <div className="flex justify-between">
                <span className="text-gray-500">Waktu Tutup</span>
                <span className="font-medium">{formatDate(cashShift.closedAt)}</span>
              </div>
            )}
            {cashShift.catatan && (
              <div>
                <span className="text-gray-500">Catatan</span>
                <p className="font-medium mt-1">{cashShift.catatan}</p>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-white p-6">
          <h5 className="font-semibold mb-4">Ringkasan Kas</h5>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">Jumlah Buka</span>
              <span className="font-medium">{formatRupiah(cashShift.jumlahBuka)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Total Penjualan</span>
              <span className="font-medium">{formatRupiah(totalPenjualan)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Jumlah Expected</span>
              <span className="font-medium">{formatRupiah(cashShift.jumlahExpected)}</span>
            </div>
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
        </div>
      </div>

      <div className="mt-6 rounded-lg border bg-white p-6">
        <h5 className="font-semibold mb-4">Pesanan dalam Shift</h5>
        {ordersLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : orders.length > 0 ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No</TableHead>
                  <TableHead>Nomor Pesanan</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order, index) => (
                  <TableRow key={order.id} className="cursor-pointer" onClick={() => navigate({ to: '/orders/$orderId', params: { orderId: order.id } })}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs hover:bg-gray-200">{order.orderNumber}</code>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs capitalize ${
                          order.status === 'complete'
                            ? 'bg-green-100 text-green-700'
                            : order.status === 'cancel'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {order.status === 'complete'
                          ? 'Selesai'
                          : order.status === 'cancel'
                            ? 'Dibatalkan'
                            : 'Dikembalikan'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatRupiah(order.total)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end items-center pt-4 border-t mt-4">
              <span className="font-semibold mr-4">Total</span>
              <span className="font-bold text-lg">{formatRupiah(totalPenjualan)}</span>
            </div>
          </>
        ) : (
          <p className="text-gray-500">Tidak ada pesanan</p>
        )}
      </div>
    </div>
  );
}
