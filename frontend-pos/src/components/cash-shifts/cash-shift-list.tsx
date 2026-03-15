import { Link } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Eye, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import type { CashShift } from '@/lib/api/cash-shifts';

interface CashShiftListProps {
  displayedShifts: CashShift[];
  isLoading: boolean;
  canRead: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  userOutletId?: string | null;
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

const formatDate = (date: Date | string | null): string => {
  if (!date) return '-';
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
      return 'Ditutup';
    default:
      return status;
  }
};

export function CashShiftList({
  displayedShifts,
  isLoading,
  canRead,
  currentPage,
  pageSize,
  total,
  totalPages,
  onPageChange,
  onPageSizeChange,
  userOutletId,
}: CashShiftListProps) {
  const isShowingOnlyUserShifts = !!userOutletId;

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">Riwayat Shift</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="p-6 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : displayedShifts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>
              {isShowingOnlyUserShifts
                ? 'Anda belum memiliki riwayat shift'
                : 'Belum ada riwayat shift'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="[&_tr]:border-b-0">
                <TableRow className="bg-gray-50 hover:bg-gray-50 border-b-0">
                  <TableHead className="text-gray-600 font-medium rounded-tl-lg rounded-bl-lg">
                    Kasir
                  </TableHead>
                  <TableHead className="text-gray-600 font-medium">Dibuka</TableHead>
                  <TableHead className="text-gray-600 font-medium">Ditutup</TableHead>
                  <TableHead className="text-gray-600 font-medium">Penjualan</TableHead>
                  <TableHead className="text-gray-600 font-medium">Transaksi</TableHead>
                  <TableHead className="text-gray-600 font-medium">Status</TableHead>
                  <TableHead className="text-gray-600 font-medium rounded-tr-lg rounded-br-lg">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedShifts.map((shift) => (
                  <TableRow key={shift.id} className="hover:bg-gray-50/50">
                    <TableCell className="font-medium text-gray-900">
                      {shift.cashier?.name || '-'}
                    </TableCell>
                    <TableCell className="text-gray-600">{formatDate(shift.openedAt)}</TableCell>
                    <TableCell className="text-gray-600">
                      {shift.closedAt ? formatDate(shift.closedAt) : '-'}
                    </TableCell>
                    <TableCell className="text-gray-900 font-medium">
                      {formatRupiah(shift.jumlahTutup || '0')}
                    </TableCell>
                    <TableCell className="text-gray-600 text-center">0</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium ${getStatusColor(
                          shift.status
                        )}`}
                      >
                        {getStatusLabel(shift.status)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {canRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-400 hover:text-gray-600"
                            asChild
                          >
                            <Link
                              to="/cash-shifts/$cashShiftId"
                              params={{ cashShiftId: shift.id }}
                              title="Lihat detail shift"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 0 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, total)} dari {total} shift
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
  );
}
