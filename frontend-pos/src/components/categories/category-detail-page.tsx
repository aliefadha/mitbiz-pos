import { useQuery } from '@tanstack/react-query';
import { Link, useParams } from '@tanstack/react-router';
import { ArrowLeft, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { categoriesApi } from '@/lib/api/categories';
import { productsApi } from '@/lib/api/products';
import { useSession } from '@/lib/auth-client';

export function CategoryDetailPage() {
  const { categoryId } = useParams({ from: '/_protected/categories/$categoryId' });
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => categoriesApi.getById(categoryId),
    enabled: !!categoryId,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'category', categoryId, tenantId],
    queryFn: () =>
      productsApi.getAll({
        tenantId,
        categoryId: categoryId,
      }),
    enabled: !!categoryId && !!tenantId,
  });

  const products = productsData?.data ?? [];

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(Number(value));
  };

  if (categoryLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!category || (tenantId && category.tenantId !== tenantId)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Kategori tidak ditemukan</p>
        <Button variant="link" onClick={() => window.history.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => window.history.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h4 className="text-lg font-semibold m-0">Detail Kategori</h4>
          <p className="text-sm text-gray-500 m-0">Lihat informasi dan produk dalam kategori ini</p>
        </div>
      </div>

      <Card>
        <CardContent className="py-6">
          <div className="grid grid-cols-2 mx-auto gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 m-0">Nama</p>
              <p className="font-medium m-0">{category.nama}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 m-0">Jumlah Produk</p>
              <p className="font-medium m-0">{products.length}</p>
            </div>
          </div>

          {category.deskripsi && (
            <div className="mt-6 pt-6 border-t">
              <p className="text-sm text-gray-500 m-0 mb-1">Deskripsi</p>
              <p className="m-0">{category.deskripsi}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <h5 className="font-semibold mb-4">Produk</h5>
        {productsLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : products.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 m-0">Belum ada produk dalam kategori ini</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent>
              <h4 className="text-base font-semibold mb-6">Daftar Produk</h4>
              <Table>
                <TableHeader className="[&_tr]:border-b-0">
                  <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                    <TableHead className="text-gray-800 font-medium w-[80px] rounded-tl-lg rounded-bl-lg">
                      No
                    </TableHead>
                    <TableHead className="text-gray-800 font-medium">Nama Produk</TableHead>
                    <TableHead className="text-gray-800 font-medium">SKU</TableHead>
                    <TableHead className="text-gray-800 font-medium rounded-tr-lg rounded-br-lg">
                      Harga
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product, index) => (
                    <TableRow key={product.id} className="hover:bg-white">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        <Link
                          to="/products/$productId"
                          params={{ productId: product.id.toString() }}
                          className="hover:underline"
                        >
                          {product.nama}
                        </Link>
                      </TableCell>
                      <TableCell>{product.sku}</TableCell>
                      <TableCell>{formatCurrency(product.hargaJual)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
