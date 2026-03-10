import { Link } from '@tanstack/react-router';
import { Package } from 'lucide-react';
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
import { useCategoryProducts } from './hooks/use-category-products';

interface CategoryProductsListProps {
  categoryId: string;
  tenantId: string;
}

export function CategoryProductsList({ categoryId, tenantId }: CategoryProductsListProps) {
  const { products, productsLoading } = useCategoryProducts(categoryId, tenantId);

  const formatCurrency = (value: string | number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(Number(value));
  };

  return (
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
            <Button variant="link" asChild>
              <Link to="/products">Tambah produk</Link>
            </Button>
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
  );
}
