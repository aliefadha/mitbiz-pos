import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
import { ordersApi } from '@/lib/api/orders';

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(num)
    .replace('IDR', 'Rp')
    .trim();
}

function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

interface OrdersTabProps {
  tenantId: string;
}

export function OrdersTab({ tenantId }: OrdersTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: ordersData, isLoading } = useQuery({
    queryKey: ['tenant-orders', tenantId, currentPage, pageSize],
    queryFn: () => ordersApi.getAll({ tenantId, page: currentPage, limit: pageSize }),
  });

  const orders = ordersData?.data || [];
  const total = ordersData?.meta?.total || 0;
  const totalPages = ordersData?.meta?.totalPages || 0;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-3 pt-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-14 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <ShoppingCart className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">Belum ada pesanan</p>
        <p className="text-xs mt-1">Pesanan yang masuk akan muncul di sini</p>
      </div>
    );
  }

  const statusConfig: Record<string, { label: string; className: string }> = {
    complete: {
      label: 'Selesai',
      className: 'bg-green-100 text-green-700 hover:bg-green-100',
    },
    cancel: {
      label: 'Dibatalkan',
      className: 'bg-red-100 text-red-700 hover:bg-red-100',
    },
    refunded: {
      label: 'Refund',
      className: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
    },
  };

  return (
    <div className="pt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Order</TableHead>
            <TableHead>Outlet</TableHead>
            <TableHead>Kasir</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Tanggal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.complete;
            return (
              <TableRow key={order.id}>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                    {order.orderNumber}
                  </code>
                </TableCell>
                <TableCell className="text-gray-500">{order.outlet?.nama || '—'}</TableCell>
                <TableCell className="text-gray-500">
                  {order.cashier?.name || order.cashier?.email || '—'}
                </TableCell>
                <TableCell>
                  <Badge className={status.className}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right font-medium text-gray-900">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell className="text-gray-500">{formatDateTime(order.createdAt)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {totalPages > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, total)} dari {total} pesanan
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => handlePageSizeChange(parseInt(value))}
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
              onClick={() => handlePageChange(currentPage - 1)}
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
                      onClick={() => handlePageChange(page as number)}
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
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
