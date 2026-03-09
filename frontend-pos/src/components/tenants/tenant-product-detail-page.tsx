import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Edit2, History, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { categoriesApi } from '@/lib/api/categories';
import { outletsApi } from '@/lib/api/outlets';
import { productsApi, type UpdateProductDto } from '@/lib/api/products';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';
import { stocksApi } from '@/lib/api/stocks';
import { useSession } from '@/lib/auth-client';

function formatRupiah(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

const adjustmentFormSchema = z.object({
  outletId: z.string(),
  quantity: z.number(),
  alasan: z.string().optional(),
});

const editFormSchema = z.object({
  sku: z.string(),
  barcode: z.string().optional(),
  nama: z.string(),
  deskripsi: z.string().optional(),
  categoryId: z.string().optional(),
  tipe: z.enum(['barang', 'jasa', 'digital']),
  hargaBeli: z.string(),
  hargaJual: z.string(),
  minStockLevel: z.number(),
  unit: z.string(),
  isActive: z.boolean(),
});

export function TenantProductDetailPage() {
  const { slug, productId } = useParams({ from: '/_protected/tenants/$slug/products/$productId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const adjustmentForm = useForm<z.infer<typeof adjustmentFormSchema>>({
    resolver: zodResolver(adjustmentFormSchema),
    defaultValues: {
      outletId: '',
      quantity: 0,
      alasan: '',
    },
  });

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      sku: '',
      barcode: '',
      nama: '',
      deskripsi: '',
      categoryId: '',
      tipe: 'barang',
      hargaBeli: '0',
      hargaJual: '0',
      minStockLevel: 0,
      unit: 'pcs',
      isActive: true,
    },
  });

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId),
    enabled: !!productId,
  });

  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ['stocks', productId],
    queryFn: () => stocksApi.getAll({ productId: productId }),
    enabled: !!productId,
  });

  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ['stock-adjustments', productId],
    queryFn: () => stockAdjustmentsApi.getAll({ productId: productId }),
    enabled: !!productId,
  });

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', product?.tenantId],
    queryFn: () => outletsApi.getAll({ tenantId: product!.tenantId }),
    enabled: !!product?.tenantId,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', product?.tenantId],
    queryFn: () => categoriesApi.getAll({ tenantId: product!.tenantId }),
    enabled: !!product?.tenantId,
  });

  const { data: session } = useSession();
  const userId = session?.user?.id;

  const createAdjustmentMutation = useMutation({
    mutationFn: (data: {
      productId: string;
      outletId: string;
      quantity: number;
      alasan?: string;
      adjustedBy: string;
    }) => stockAdjustmentsApi.create(data),
    onSuccess: () => {
      setAdjustmentModalOpen(false);
      adjustmentForm.reset();
      queryClient.invalidateQueries({ queryKey: ['stocks', productId] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments', productId] });
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      setEditModalOpen(false);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const isLoading = productLoading || stocksLoading || adjustmentsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (!product) {
    return <div>Product not found</div>;
  }

  const stocks = stocksData?.data || [];
  const adjustments = adjustmentsData?.data || [];
  const outlets = outletsData?.data || [];
  const categories = categoriesData?.data || [];

  const handleEdit = () => {
    editForm.reset({
      sku: product.sku,
      nama: product.nama,
      deskripsi: product.deskripsi || '',
      categoryId: product.categoryId?.toString() || '',
      hargaBeli: product.hargaBeli || '0',
      hargaJual: product.hargaJual || '0',
      minStockLevel: product.minStockLevel || 0,
      unit: product.unit,
      isActive: product.isActive,
    });
    setEditModalOpen(true);
  };

  const totalStock = stocks.reduce((sum, stock) => sum + stock.quantity, 0);

  const getStockColor = (quantity: number) => {
    if (quantity <= 0) return 'bg-red-100 text-red-700';
    if (quantity <= product.minStockLevel) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div>
      <Button
        variant="link"
        onClick={() => navigate({ to: '/tenants/$slug', params: { slug } })}
        className="mb-4 pl-0"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Tenant
      </Button>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Detail Produk</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Ubah
            </Button>
            <Button onClick={() => setAdjustmentModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Stok
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">SKU:</span>{' '}
              <code className="bg-gray-100 px-2 py-1 rounded">{product.sku}</code>
            </div>
            <div>
              <span className="text-gray-500">Nama:</span> {product.nama}
            </div>
            <div>
              <span className="text-gray-500">Kategori:</span> {product.category?.nama || '-'}
            </div>
            <div>
              <span className="text-gray-500">Satuan:</span> {product.unit || '-'}
            </div>
            <div>
              <span className="text-gray-500">Harga Beli:</span>{' '}
              {product.hargaBeli ? formatRupiah(product.hargaBeli) : '-'}
            </div>
            <div>
              <span className="text-gray-500">Harga Jual:</span> {formatRupiah(product.hargaJual)}
            </div>
            <div>
              <span className="text-gray-500">Minimum Stok:</span> {product.minStockLevel}
            </div>
            <div>
              <span className="text-gray-500">Status:</span>{' '}
              <span
                className={`px-2 py-1 rounded text-xs ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
              >
                {product.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-gray-500">Deskripsi:</span> {product.deskripsi || '-'}
            </div>
            <div>
              <span className="text-gray-500">Dibuat:</span>{' '}
              {new Date(product.createdAt).toLocaleString('id-ID')}
            </div>
            <div>
              <span className="text-gray-500">Diupdate:</span>{' '}
              {new Date(product.updatedAt).toLocaleString('id-ID')}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-sm text-gray-500">Total Stok</p>
              <p
                className={`text-2xl font-bold ${totalStock <= product.minStockLevel ? 'text-orange-500' : 'text-green-500'}`}
              >
                {totalStock}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Minimum Stok</p>
              <p className="text-2xl font-bold text-blue-500">{product.minStockLevel}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Jumlah Outlet</p>
              <p className="text-2xl font-bold text-purple-500">{stocks.length}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">Jumlah Penyesuaian</p>
              <p className="text-2xl font-bold text-pink-500">{adjustments.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <Tabs defaultValue="stocks">
          <TabsList>
            <TabsTrigger value="stocks" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Stok per Outlet ({stocks.length})
            </TabsTrigger>
            <TabsTrigger value="adjustments" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Riwayat Penyesuaian ({adjustments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="stocks">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Terakhir Diupdate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stocks.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell>
                      {stock.outlet ? `${stock.outlet.nama} (${stock.outlet.kode})` : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded ${getStockColor(stock.quantity)}`}>
                        {stock.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{new Date(stock.updatedAt).toLocaleString('id-ID')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>

          <TabsContent value="adjustments">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Outlet</TableHead>
                  <TableHead>Jumlah</TableHead>
                  <TableHead>Alasan</TableHead>
                  <TableHead>Oleh</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adjustments.map((adj) => (
                  <TableRow key={adj.id}>
                    <TableCell>{new Date(adj.createdAt).toLocaleString('id-ID')}</TableCell>
                    <TableCell>
                      {adj.outlet ? `${adj.outlet.nama} (${adj.outlet.kode})` : '-'}
                    </TableCell>
                    <TableCell>
                      <span className={adj.quantity >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                      </span>
                    </TableCell>
                    <TableCell>{adj.alasan || '-'}</TableCell>
                    <TableCell>{adj.user?.name || adj.user?.email || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog open={adjustmentModalOpen} onOpenChange={setAdjustmentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Penyesuaian Stok</DialogTitle>
          </DialogHeader>
          <Form {...adjustmentForm}>
            <form
              onSubmit={adjustmentForm.handleSubmit((v) => {
                if (userId)
                  createAdjustmentMutation.mutate({
                    productId: productId,
                    outletId: v.outletId,
                    quantity: v.quantity,
                    alasan: v.alasan,
                    adjustedBy: userId,
                  });
              })}
              className="space-y-4"
            >
              <FormField
                control={adjustmentForm.control}
                name="outletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outlet</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih outlet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {outlets.map((outlet) => (
                          <SelectItem key={outlet.id} value={outlet.id.toString()}>
                            {outlet.nama} ({outlet.kode})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adjustmentForm.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Masukkan jumlah"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500">
                      Angka positif untuk tambah, negatif untuk kurang
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={adjustmentForm.control}
                name="alasan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Alasan</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Masukkan alasan (opsional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={createAdjustmentMutation.isPending}>
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Produk</DialogTitle>
          </DialogHeader>
          <Form {...editForm}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <FormField
                control={editForm.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="nama"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Nama</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih kategori" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id.toString()}>
                            {cat.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="tipe"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipe</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih tipe" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="barang">Barang</SelectItem>
                        <SelectItem value="jasa">Jasa</SelectItem>
                        <SelectItem value="digital">Digital</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="hargaBeli"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Beli</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="hargaJual"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Harga Jual</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="minStockLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Minimum Stok</FormLabel>
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
              <FormField
                control={editForm.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Satuan</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                onClick={editForm.handleSubmit((v) =>
                  updateMutation.mutate({
                    id: productId,
                    data: {
                      ...v,
                      hargaBeli: v.hargaBeli || '0',
                      hargaJual: v.hargaJual || '0',
                      categoryId: v.categoryId ? v.categoryId : undefined,
                    } as UpdateProductDto,
                  })
                )}
                disabled={updateMutation.isPending}
              >
                Simpan
              </Button>
            </DialogFooter>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
