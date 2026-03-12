import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
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
import type { Outlet } from '@/lib/api/outlets';
import type { Product } from '@/lib/api/products';
import type { StockAdjustment } from '@/lib/api/stock-adjustments';

interface StockAdjustmentListProps {
  displayedAdjustments: StockAdjustment[];
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  productFilter: string;
  outletFilter: string;
  products: Product[];
  outlets: Outlet[];
  getAdjustmentTypeColor: (quantity: number) => string;
  getAdjustmentType: (quantity: number) => string;
  onProductFilterChange: (value: string) => void;
  onOutletFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function StockAdjustmentList({
  displayedAdjustments,
  isLoading,
  currentPage,
  pageSize,
  total,
  totalPages,
  productFilter,
  outletFilter,
  products,
  outlets,
  getAdjustmentTypeColor,
  getAdjustmentType,
  onProductFilterChange,
  onOutletFilterChange,
  onPageChange,
  onPageSizeChange,
}: StockAdjustmentListProps) {
  return (
    <Card>
      <CardContent>
        <h4 className="text-base font-semibold mb-6">Daftar Penyesuaian</h4>
        <div className="grid grid-cols-2 gap-2 mb-6 w-full">
          <Select
            value={productFilter || 'all'}
            onValueChange={(value) => {
              onProductFilterChange(value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Produk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Produk</SelectItem>
              {products.map((product) => (
                <SelectItem key={`product-${product.id}`} value={product.id}>
                  {product.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={outletFilter || 'all'}
            onValueChange={(value) => {
              onOutletFilterChange(value);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Outlet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Outlet</SelectItem>
              {outlets.map((outlet) => (
                <SelectItem key={`outlet-${outlet.id}`} value={outlet.id}>
                  {outlet.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <Table>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                <TableHead className="text-gray-800 font-medium rounded-tl-lg rounded-bl-lg">
                  Tanggal
                </TableHead>
                <TableHead className="text-gray-800 font-medium">Produk</TableHead>
                <TableHead className="text-gray-800 font-medium">Outlet</TableHead>
                <TableHead className="text-gray-800 font-medium">Tipe</TableHead>
                <TableHead className="text-gray-800 font-medium">Jumlah</TableHead>
                <TableHead className="text-gray-800 font-medium rounded-tr-lg rounded-br-lg">
                  Alasan
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-16 rounded-md" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-12" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Table>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                <TableHead className="text-gray-800 font-medium rounded-tl-lg rounded-bl-lg">
                  Tanggal
                </TableHead>
                <TableHead className="text-gray-800 font-medium">Produk</TableHead>
                <TableHead className="text-gray-800 font-medium">Outlet</TableHead>
                <TableHead className="text-gray-800 font-medium">Tipe</TableHead>
                <TableHead className="text-gray-800 font-medium">Jumlah</TableHead>
                <TableHead className="text-gray-800 font-medium rounded-tr-lg rounded-br-lg">
                  Alasan
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedAdjustments.length === 0 ? (
                <TableRow className="hover:bg-white">
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    Tidak ada data penyesuaian stok
                  </TableCell>
                </TableRow>
              ) : (
                displayedAdjustments.map((adjustment) => (
                  <TableRow key={adjustment.id} className="hover:bg-white">
                    <TableCell>
                      {adjustment.createdAt
                        ? new Date(adjustment.createdAt).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : '-'}
                    </TableCell>
                    <TableCell>{adjustment.product?.nama || 'Unknown Product'}</TableCell>
                    <TableCell>{adjustment.outlet?.nama || '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${getAdjustmentTypeColor(adjustment.quantity)}`}
                      >
                        {adjustment.quantity > 0 ? (
                          <ArrowUp className="h-3 w-3" />
                        ) : adjustment.quantity < 0 ? (
                          <ArrowDown className="h-3 w-3" />
                        ) : null}
                        {getAdjustmentType(adjustment.quantity)}
                      </span>
                    </TableCell>
                    <TableCell>{adjustment.quantity}</TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{adjustment.alasan || '-'}</span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {totalPages > 0 && (
          <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                {Math.min(currentPage * pageSize, total)} dari {total} penyesuaian
              </span>
              <Select
                value={pageSize.toString()}
                onValueChange={(value) => {
                  onPageSizeChange(parseInt(value));
                }}
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
