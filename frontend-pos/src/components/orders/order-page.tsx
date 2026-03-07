import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Eye, Search } from 'lucide-react';
import { useState } from 'react';
import { StatCardsLaporan } from '@/components/dashboard/stat-cards-laporan';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ordersApi } from '@/lib/api/orders';
import { outletsApi } from '@/lib/api/outlets';
import { useSession } from '@/lib/auth-client';

export function OrderPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [outletFilter, setOutletFilter] = useState<string>('all');

  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return thirtyDaysAgo.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', tenantId, outletFilter, searchQuery, statusFilter],
    queryFn: () =>
      ordersApi.getAll({
        tenantId,
        outletId: outletFilter !== 'all' ? outletFilter : undefined,
        search: searchQuery || undefined,
        status:
          statusFilter !== 'all' ? (statusFilter as 'complete' | 'cancel' | 'refunded') : undefined,
      }),
    enabled: !!tenantId,
  });

  const handleView = (orderId: string) => {
    navigate({ to: '/orders/$orderId', params: { orderId } });
  };
  const displayedOrders = ordersData?.data ?? [];

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

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h4 className="text-lg font-semibold m-0">Riwayat Transaksi</h4>
        <p className="text-sm text-gray-500 m-0">Lihat semua transaksi yang telah dilakukan</p>
      </div>

      <StatCardsLaporan
        tenantId={tenantId}
        outletId={outletFilter !== 'all' ? outletFilter : undefined}
        startDate={startDate}
        endDate={endDate}
      />

      <Card className="shadow-sm border-gray-200">
        <CardContent className="flex flex-col gap-y-6">
          <h1 className="font-semibold">Daftar Transaksi</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari pesanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Select value={outletFilter} onValueChange={setOutletFilter}>
                <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600">
                  <SelectValue placeholder="Semua Outlet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Outlet</SelectItem>
                  {outletsData?.data?.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="complete">Selesai</SelectItem>
                  <SelectItem value="cancel">Dibatalkan</SelectItem>
                  <SelectItem value="refunded">Dikembalikan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {ordersLoading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader className="[&_tr]:border-b-0">
                <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                  <TableHead className=" text-gray-800 font-medium rounded-tl-lg rounded-bl-lg">
                    Nomor Pesanan
                  </TableHead>
                  <TableHead className=" text-gray-800 font-medium">Tanggal</TableHead>
                  <TableHead className=" text-gray-800 font-medium">Outlet</TableHead>
                  <TableHead className=" text-gray-800 font-medium">Kasir</TableHead>
                  <TableHead className=" text-gray-800 font-medium">Metode Pembayaran</TableHead>
                  <TableHead className=" text-gray-800 font-medium">Total</TableHead>
                  <TableHead className=" text-gray-800 font-medium w-[120px] rounded-tr-lg rounded-br-lg">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-white">
                    <TableCell>
                      <span className="truncate max-w-[120px] block text-gray-900 font-medium ">
                        {order.orderNumber}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{order.outlet?.nama || '-'}</TableCell>
                    <TableCell>{order.cashier?.name || '-'}</TableCell>
                    <TableCell>
                      {order.paymentMethod?.nama ? (
                        <span className="border border-black/90 rounded-md px-2 py-1 text-sm">
                          {order.paymentMethod.nama}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatRupiah(order.total)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(order.id)}
                        className="border"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!ordersLoading && ordersData?.meta && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Menampilkan {displayedOrders.length} dari {ordersData.meta.total} pesanan
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
