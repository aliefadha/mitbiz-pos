import { ChevronLeft, ChevronRight, Package, Search } from 'lucide-react';
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
import type { Outlet } from '@/lib/api/outlets';
import type { Product } from '@/lib/api/products';
import type { Stock } from '@/lib/api/stocks';

interface StockListProps {
  displayedStocks: Stock[];
  isLoading: boolean;
  currentPage: number;
  pageSize: number;
  total: number;
  totalPages: number;
  searchQuery: string;
  productFilter: string;
  outletFilter: string;
  products: Product[];
  outlets: Outlet[];
  hasOutletId: boolean;
  getStockStatusColor: (quantity: number, minStockLevel?: number) => string;
  getStockStatusText: (quantity: number, minStockLevel?: number) => string;
  onSearchChange: (query: string) => void;
  onProductFilterChange: (value: string) => void;
  onOutletFilterChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export function StockList({
  displayedStocks,
  isLoading,
  currentPage,
  pageSize,
  total,
  totalPages,
  searchQuery,
  productFilter,
  outletFilter,
  products,
  outlets,
  hasOutletId,
  getStockStatusColor,
  getStockStatusText,
  onSearchChange,
  onProductFilterChange,
  onOutletFilterChange,
  onPageChange,
  onPageSizeChange,
}: StockListProps) {
  const [localSearch, setLocalSearch] = useState(searchQuery);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch);
  };

  return (
    <Card>
      <CardContent>
        <h4 className="text-base font-semibold mb-6">Daftar Stok</h4>
        <div className={`grid gap-2 mb-6 w-full ${hasOutletId ? 'grid-cols-2' : 'grid-cols-3'}`}>
          <form onSubmit={handleSearchSubmit} className="relative flex">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari produk atau outlet..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 w-full"
            />
          </form>
          <Select value={productFilter || 'all'} onValueChange={onProductFilterChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Semua Produk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Produk</SelectItem>
              {products.map((product, index) => (
                <SelectItem key={`${product.id}-${index}`} value={product.id}>
                  {product.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!hasOutletId && (
            <Select value={outletFilter || 'all'} onValueChange={onOutletFilterChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Semua Outlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Outlet</SelectItem>
                {outlets.map((outlet, index) => (
                  <SelectItem key={`${outlet.id}-${index}`} value={outlet.id}>
                    {outlet.nama}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : displayedStocks.length === 0 ? (
          <div className="text-center py-10 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Tidak ada data stok</p>
          </div>
        ) : (
          <Table>
            <TableHeader className="[&_tr]:border-b-0">
              <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                <TableHead className="text-gray-800 font-medium rounded-tl-lg rounded-bl-lg">
                  Produk
                </TableHead>
                <TableHead className="text-gray-800 font-medium">Kategori</TableHead>
                <TableHead className="text-gray-800 font-medium">Outlet</TableHead>
                <TableHead className="text-gray-800 font-medium">Jumlah Tersedia</TableHead>
                <TableHead className="text-gray-800 font-medium">Min. Stok</TableHead>
                <TableHead className="text-gray-800 font-medium">Status</TableHead>
                <TableHead className="text-gray-800 font-medium rounded-tr-lg rounded-br-lg">
                  Terakhir Update
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedStocks.map((stock, index) => (
                <TableRow className="hover:bg-white" key={`${stock.id}-${index}`}>
                  <TableCell>
                    <span>{stock.product?.nama || 'Unknown Product'}</span>
                  </TableCell>
                  <TableCell>
                    <span>{stock.product?.category?.nama || '-'}</span>
                  </TableCell>
                  <TableCell>{stock.outlet?.nama || '-'}</TableCell>
                  <TableCell>
                    <span>{stock.quantity}</span>
                  </TableCell>
                  <TableCell>
                    <span>{stock.product?.minStockLevel}</span>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1.5 rounded-md text-xs ${getStockStatusColor(stock.quantity, stock.product?.minStockLevel)}`}
                    >
                      {getStockStatusText(stock.quantity, stock.product?.minStockLevel)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {stock.updatedAt
                      ? new Date(stock.updatedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '-'}
                  </TableCell>
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
                {Math.min(currentPage * pageSize, total)} dari {total} stok
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
