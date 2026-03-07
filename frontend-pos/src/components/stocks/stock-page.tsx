import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Package, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { outletsApi } from '@/lib/api/outlets';
import { productsApi } from '@/lib/api/products';
import { stocksApi } from '@/lib/api/stocks';
import { useSession } from '@/lib/auth-client';

export function StockPage() {
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;
  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState<string>('');
  const [outletFilter, setOutletFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ['stocks', tenantId, productFilter, outletFilter, currentPage, pageSize],
    queryFn: () =>
      stocksApi.getAll({
        tenantId,
        productId: productFilter || undefined,
        outletId: outletFilter || undefined,
        page: currentPage,
        limit: pageSize,
      }),
    enabled: !!tenantId,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => productsApi.getAll({ tenantId, limit: 100 }),
    enabled: !!tenantId,
  });

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const displayedStocks = stocksData?.data ?? [];
  const products = productsData?.data ?? [];
  const outlets = outletsData?.data ?? [];

  const filteredStocks = searchQuery
    ? displayedStocks.filter(
        (stock) =>
          stock.product?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.product?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.outlet?.nama.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayedStocks;

  const totalProduk = products.length;
  const stokMenipis = filteredStocks.filter((stock) => {
    const minStock = stock.product?.minStockLevel ?? 10;
    return stock.quantity > 0 && stock.quantity <= minStock;
  }).length;
  const stokHabis = filteredStocks.filter((stock) => stock.quantity === 0).length;

  const getStockStatusColor = (quantity: number, minStockLevel?: number) => {
    const minStock = minStockLevel ?? 10;
    if (quantity === 0) return 'bg-red-100 text-red-700';
    if (quantity <= minStock) return 'bg-yellow-100 text-yellow-700';
    return 'bg-blue-500 text-white';
  };

  const getStockStatusText = (quantity: number, minStockLevel?: number) => {
    const minStock = minStockLevel ?? 10;
    if (quantity === 0) return 'Habis';
    if (quantity <= minStock) return 'Menipis';
    return 'Tersedia';
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-semibold m-0">Manajemen Inventori</h4>
            <p className="text-sm text-gray-500 m-0">Monitor dan kelola stok produk per cabang</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
              <Package className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalProduk}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Menipis</CardTitle>
              <Package className="h-4 w-4 text-red-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stokMenipis}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Stok Habis</CardTitle>
              <Package className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stokHabis}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent>
            <h4 className="text-base font-semibold mb-6">Daftar Stok</h4>
            <div className="grid grid-cols-3 gap-2 mb-6 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari produk atau outlet..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-full"
                />
              </div>
              <Select
                value={productFilter || 'all'}
                onValueChange={(value) => {
                  setProductFilter(value === 'all' ? '' : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Produk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Produk</SelectItem>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={outletFilter || 'all'}
                onValueChange={(value) => {
                  setOutletFilter(value === 'all' ? '' : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Outlet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Outlet</SelectItem>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {stocksLoading ? (
              <div className="p-6 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
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
                  {filteredStocks.length === 0 ? (
                    <TableRow className="hover:bg-white">
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        Tidak ada data stok
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredStocks.map((stock) => (
                      <TableRow className="hover:bg-white" key={stock.id}>
                        <TableCell>
                          <span className="font-medium">
                            {stock.product?.nama || 'Unknown Product'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-600">
                            {stock.product?.category?.nama || '-'}
                          </span>
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
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {stocksData?.meta && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                    {Math.min(currentPage * pageSize, stocksData.meta.total)} dari{' '}
                    {stocksData.meta.total} stok
                  </span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(parseInt(value));
                      setCurrentPage(1);
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
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const totalPages = stocksData.meta.totalPages;
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
                            onClick={() => setCurrentPage(page as number)}
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
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === stocksData.meta.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
