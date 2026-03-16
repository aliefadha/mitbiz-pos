import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Package } from 'lucide-react';
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
import { productsApi } from '@/lib/api/products';

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

interface ProductsTabProps {
  tenantId: string;
}

export function ProductsTab({ tenantId }: ProductsTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['tenant-products', tenantId, currentPage, pageSize],
    queryFn: () => productsApi.getAll({ tenantId, page: currentPage, limit: pageSize }),
  });

  const products = productsData?.data || [];
  const total = productsData?.meta?.total || 0;
  const totalPages = productsData?.meta?.totalPages || 0;

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

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Package className="h-12 w-12 mb-3 opacity-40" />
        <p className="text-sm font-medium">Belum ada produk</p>
        <p className="text-xs mt-1">Produk yang terdaftar akan muncul di sini</p>
      </div>
    );
  }

  return (
    <div className="pt-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Nama Produk</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="text-right">Harga Beli</TableHead>
            <TableHead className="text-right">Harga Jual</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id}>
              <TableCell>
                <code className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-600">
                  {product.sku}
                </code>
              </TableCell>
              <TableCell className="font-medium text-gray-900">{product.nama}</TableCell>
              <TableCell className="text-gray-500">{product.category?.nama || '—'}</TableCell>
              <TableCell className="text-right text-gray-500">
                {product.hargaBeli ? formatCurrency(product.hargaBeli) : '—'}
              </TableCell>
              <TableCell className="text-right font-medium text-gray-900">
                {formatCurrency(product.hargaJual)}
              </TableCell>
              <TableCell className="text-gray-500">{product.unit}</TableCell>
              <TableCell>
                <Badge
                  className={
                    product.isActive
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : 'bg-red-100 text-red-700 hover:bg-red-100'
                  }
                >
                  {product.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {totalPages > 0 && (
        <div className="flex items-center justify-between px-2 py-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
              {Math.min(currentPage * pageSize, total)} dari {total} produk
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
