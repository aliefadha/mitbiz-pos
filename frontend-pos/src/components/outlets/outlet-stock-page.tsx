import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Edit2, Package, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
import { type Product, productsApi } from '@/lib/api/products';
import { type Stock, stocksApi } from '@/lib/api/stocks';
import { tenantsApi } from '@/lib/api/tenants';

interface ProductStockRow {
  product: Product;
  stock: Stock | null;
}

const editFormSchema = z.object({
  quantity: z.number(),
});

export function OutletStockPage() {
  const { outletId } = useParams({
    from: '/_protected/outlets/$outletId',
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchText, setSearchText] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ProductStockRow | null>(null);

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: { quantity: 0 },
  });

  const { data: outlet, isLoading: outletLoading } = useQuery({
    queryKey: ['outlet', outletId],
    queryFn: () => outletsApi.getById(outletId),
  });

  const { data: tenantData } = useQuery({
    queryKey: ['tenants', { id: outlet?.tenantId }],
    queryFn: () => tenantsApi.getAll({ tenantId: outlet!.tenantId } as any),
    enabled: !!outlet?.tenantId,
    select: (data) => data?.[0],
  });

  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ['stocks', { outletId: outletId }],
    queryFn: () => stocksApi.getAll({ outletId: outletId }),
    enabled: !!outletId,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', outlet?.tenantId],
    queryFn: () => productsApi.getAll({ tenantId: outlet!.tenantId }),
    enabled: !!outlet?.tenantId,
  });

  const invalidateStocks = () => {
    queryClient.invalidateQueries({ queryKey: ['stocks', { outletId: outletId }] });
  };

  const createStockMutation = useMutation({
    mutationFn: (data: { productId: string; outletId: string; quantity: number }) =>
      stocksApi.create(data),
    onSuccess: () => {
      invalidateStocks();
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ stockId, quantity }: { stockId: string; quantity: number }) =>
      stocksApi.update(stockId, { quantity }),
    onSuccess: () => {
      invalidateStocks();
      setIsEditModalOpen(false);
      setEditingRow(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const deleteStockMutation = useMutation({
    mutationFn: (stockId: string) => stocksApi.delete(stockId),
    onSuccess: () => {
      invalidateStocks();
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const stocks = stocksData?.data || [];
  const products = productsData?.data || [];

  const stockByProductId = new Map<string, Stock>();
  stocks.forEach((s: Stock) => stockByProductId.set(s.productId, s));

  const rows: ProductStockRow[] = products.map((product: Product) => ({
    product,
    stock: stockByProductId.get(product.id) || null,
  }));

  const filteredRows = rows.filter((row) => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      row.product.nama.toLowerCase().includes(search) ||
      row.product.sku.toLowerCase().includes(search)
    );
  });

  const handleAddStock = (productId: string) => {
    createStockMutation.mutate({ productId, outletId: outletId, quantity: 0 });
  };

  const handleEditStock = (row: ProductStockRow) => {
    setEditingRow(row);
    editForm.reset({ quantity: row.stock?.quantity || 0 });
    setIsEditModalOpen(true);
  };

  const handleDeleteStock = (stockId: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus stock ini?')) {
      deleteStockMutation.mutate(stockId);
    }
  };

  if (outletLoading) {
    return (
      <div className="flex justify-center py-24">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  const totalWithStock = rows.filter((r) => r.stock !== null).length;

  return (
    <div>
      <Button
        variant="link"
        onClick={() =>
          navigate({ to: '/tenants/$slug/outlets', params: { slug: tenantData?.slug || '' } })
        }
        className="mb-4 pl-0"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Outlets
      </Button>

      <Card className="mb-6">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Stock — {outlet?.nama || 'Outlet'}</h3>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Kode:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">{outlet?.kode || '-'}</code>
            </div>
            <div>
              <span className="text-gray-500">Nama:</span> {outlet?.nama || '-'}
            </div>
            <div>
              <span className="text-gray-500">Alamat:</span> {outlet?.alamat || '-'}
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-4">
        <h5 className="font-medium m-0">Daftar Produk & Stock</h5>
        <p className="text-sm text-gray-500 m-0">
          {totalWithStock} dari {products.length} produk memiliki stock di outlet ini
        </p>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Cari produk..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="max-w-[300px]"
        />
      </div>

      {stocksLoading || productsLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">No.</TableHead>
              <TableHead className="w-[120px]">SKU</TableHead>
              <TableHead>Produk</TableHead>
              <TableHead className="w-[140px]">Harga Jual</TableHead>
              <TableHead className="w-[150px]">Stock</TableHead>
              <TableHead className="w-[180px]">Terakhir Diperbarui</TableHead>
              <TableHead className="w-[100px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.map((row, index) => (
              <TableRow key={row.product.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{row.product.sku}</code>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{row.product.nama}</div>
                  {row.product.category && (
                    <div className="text-xs text-gray-500">{row.product.category.nama}</div>
                  )}
                </TableCell>
                <TableCell>
                  {Number(row.product.hargaJual).toLocaleString('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  })}
                </TableCell>
                <TableCell>
                  {!row.stock ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddStock(row.product.id)}
                    >
                      <Plus className="mr-1 h-3 w-3" /> Tambah
                    </Button>
                  ) : (
                    <span
                      className={
                        row.stock.quantity > 0
                          ? 'text-green-600 font-medium'
                          : 'text-red-600 font-medium'
                      }
                    >
                      {row.stock.quantity}
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-gray-500">
                  {row.stock?.updatedAt
                    ? new Date(row.stock.updatedAt).toLocaleString('id-ID')
                    : '-'}
                </TableCell>
                <TableCell>
                  {!row.stock ? null : (
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEditStock(row)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteStock(row.stock!.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Stock — {editingRow?.product.nama || ''}</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <form
              onSubmit={editForm.handleSubmit((v) => {
                if (editingRow?.stock)
                  updateStockMutation.mutate({
                    stockId: editingRow.stock.id,
                    quantity: v.quantity,
                  });
              })}
              className="space-y-4"
            >
              <FormField
                control={editForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateStockMutation.isPending}>
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
