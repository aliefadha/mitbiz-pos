import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Order } from '@/lib/api/orders';

interface CashShiftOrdersListProps {
  orders: Order[];
  isLoading: boolean;
}

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
    case 'complete':
      return 'bg-green-100 text-green-700';
    case 'cancel':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-yellow-100 text-yellow-700';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'complete':
      return 'Selesai';
    case 'cancel':
      return 'Dibatalkan';
    case 'refund':
      return 'Dikembalikan';
    default:
      return status;
  }
};

export function CashShiftOrdersList({ orders, isLoading }: CashShiftOrdersListProps) {
  const totalPenjualan = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

  return (
    <div>
      <h5 className="font-semibold mb-4">Pesanan dalam Shift</h5>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : orders.length > 0 ? (
        <Card>
          <CardContent>
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
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => (window.location.href = `/orders/${order.id}`)}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <code className="bg-gray-100 px-2 py-1 rounded text-xs hover:bg-gray-200">
                        {order.orderNumber}
                      </code>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {getStatusLabel(order.status)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatRupiah(order.total)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex justify-end items-center pt-4 border-t mt-4">
              <span className="font-semibold mr-4">Total</span>
              <span className="font-bold text-lg">{formatRupiah(totalPenjualan)}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 m-0">Tidak ada pesanan dalam shift ini</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
