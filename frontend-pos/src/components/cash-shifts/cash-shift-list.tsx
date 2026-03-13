import { Link } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Eye, Search, Wallet, XCircle } from 'lucide-react';
import { useState } from 'react';
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
import type { CashShift } from '@/lib/api/cash-shifts';

interface CashShiftListProps {
  displayedShifts: CashShift[];
  isLoading: boolean;
  canUpdate: boolean;
  canRead: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  onCloseShift: (shift: CashShift) => void;
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

export function CashShiftList({
  displayedShifts,
  isLoading,
  canUpdate,
  canRead,
  currentPage,
  pageSize,
  total,
  totalPages,
  searchQuery,
  onSearchChange,
  onPageChange,
  onPageSizeChange,
  onCloseShift,
}: CashShiftListProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  const hasActions = canUpdate;

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h4 className="text-base font-semibold">Daftar Shift</h4>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari shift..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" variant="secondary">
              Cari
            </Button>
          </form>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : displayedShifts.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Wallet className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Belum ada shift</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                <TableHead className="text-gray-800 font-medium w-[80px] rounded-tl-lg rounded-bl-lg">
                  No
                </TableHead>
                <TableHead className="text-gray-800 font-medium">Outlet</TableHead>
                <TableHead className="text-gray-800 font-medium">Kasir</TableHead>
                <TableHead className="text-gray-800 font-medium">Jumlah Buka</TableHead>
                <TableHead className="text-gray-800 font-medium">Jumlah Tutup</TableHead>
                <TableHead className="text-gray-800 font-medium">Status</TableHead>
                <TableHead className="text-gray-800 font-medium">Tanggal</TableHead>
                {hasActions && (
                  <TableHead className="text-gray-800 font-medium w-[120px] rounded-tr-lg rounded-br-lg">
                    Aksi
                  </TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedShifts.map((shift, index) => (
                <TableRow key={shift.id} className="hover:bg-white">
                  <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
                  <TableCell>{shift.outlet?.nama || '-'}</TableCell>
                  <TableCell>{shift.cashier?.name || '-'}</TableCell>
                  <TableCell className="font-medium">{formatRupiah(shift.jumlahBuka)}</TableCell>
                  <TableCell className="font-medium">
                    {shift.status === 'tutup' ? formatRupiah(shift.jumlahTutup) : '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(
                        shift.status
                      )}`}
                    >
                      {getStatusLabel(shift.status)}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(shift.openedAt)}</TableCell>
                  {hasActions && (
                    <TableCell>
                      <div className="flex gap-1">
                        {canRead && (
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              to="/cash-shifts/$cashShiftId"
                              params={{ cashShiftId: shift.id }}
                              title="Lihat detail shift"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                        )}
                        {canUpdate && shift.status === 'buka' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onCloseShift(shift)}
                            title="Tutup shift"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
