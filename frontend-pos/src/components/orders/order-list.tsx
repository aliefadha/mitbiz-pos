import { ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import type { Order } from '@/lib/api/orders';

interface OrderListProps {
  orders: Order[];
  isLoading: boolean;
  onView: (orderId: string) => void;
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
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

export function OrderList({
  orders,
  isLoading,
  onView,
  currentPage,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: OrderListProps) {
  return (
    <>
      {isLoading ? (
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
              <TableHead className=" text-gray-800 font-medium">Status</TableHead>
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
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-white">
                <TableCell>
                  <span className="truncate max-w-[120px] block text-gray-900 font-medium ">
                    {order.orderNumber}
                  </span>
                </TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                <TableCell>
                  {order.status === 'complete'
                    ? 'Selesai'
                    : order.status === 'cancel'
                      ? 'Dibatalkan'
                      : 'Dikembalikan'}
                </TableCell>
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
                    onClick={() => onView(order.id)}
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

      {!isLoading && totalPages > 0 && (
        <div className="flex items-center justify-between mt-4 border-t pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, total)} dari {total} pesanan
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(parseInt(value))}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-1">
              {(() => {
                const pages: (number | string)[] = [];

                if (totalPages <= 5) {
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(i);
                  }
                } else {
                  pages.push(1);

                  if (currentPage <= 3) {
                    pages.push(2, 3, '...');
                  } else if (currentPage >= totalPages - 2) {
                    pages.push('...', totalPages - 2, totalPages - 1);
                  } else {
                    pages.push('...', currentPage, '...');
                  }

                  pages.push(totalPages);
                }

                return pages.map((page, index) =>
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-sm text-gray-500">
                      ...
                    </span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onPageChange(page as number)}
                      className="w-9"
                    >
                      {page}
                    </Button>
                  )
                );
              })()}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
