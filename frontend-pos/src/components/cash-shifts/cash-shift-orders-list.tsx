import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPenjualan = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

  const total = orders.length;
  const totalPages = Math.ceil(total / pageSize);
  const displayedOrders = orders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  const onPageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

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
                {displayedOrders.map((order, index) => (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer"
                    onClick={() => (window.location.href = `/orders/${order.id}`)}
                  >
                    <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
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

            {totalPages > 0 && (
              <div className="flex items-center justify-between px-2 pt-4 border-t mt-4 mb-2">
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
