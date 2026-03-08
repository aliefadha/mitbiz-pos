import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Edit2, History, Package, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
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
import { useTenant } from '@/contexts/tenant-context';
import { categoriesApi } from '@/lib/api/categories';
import { discountsApi } from '@/lib/api/discounts';
import { productsApi, type UpdateProductDto } from '@/lib/api/products';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';
import { stocksApi } from '@/lib/api/stocks';
import { useSession } from '@/lib/auth-client';
import { Textarea } from '../ui/textarea';

function formatRupiah(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

const editFormSchema = z.object({
  sku: z.string(),
  nama: z.string(),
  deskripsi: z.string().optional(),
  categoryId: z.string().optional(),
  hargaBeli: z.string(),
  hargaJual: z.string(),
  minStockLevel: z.number(),
  enableMinStock: z.boolean(),
  unit: z.string(),
  isActive: z.boolean(),
  discountIds: z.array(z.string()).optional(),
});

export function ProductDetailPage() {
  const { productId } = useParams({ from: '/_protected/products/$productId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { selectedTenant, selectedOutlet } = useTenant();
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [createStockModalOpen, setCreateStockModalOpen] = useState(false);
  const [createStockQuantity, setCreateStockQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const editForm = useForm<z.infer<typeof editFormSchema>>({
    resolver: zodResolver(editFormSchema),
    defaultValues: {
      sku: '',
      nama: '',
      deskripsi: '',
      categoryId: 'none',
      hargaBeli: '0',
      hargaJual: '0',
      unit: 'pcs',
      minStockLevel: 0,
      enableMinStock: false,
      isActive: true,
      discountIds: [],
    },
  });

  const enableMinStock = editForm.watch('enableMinStock');

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId),
    enabled: !!productId,
  });

  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ['stocks', productId, selectedOutlet?.id],
    queryFn: () => stocksApi.getAll({ productId: productId, outletId: selectedOutlet?.id }),
    enabled: !!productId,
  });

  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ['stock-adjustments', productId, selectedOutlet?.id],
    queryFn: () =>
      stockAdjustmentsApi.getAll({ productId: productId, outletId: selectedOutlet?.id }),
    enabled: !!productId,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', product?.tenantId],
    queryFn: () => categoriesApi.getAll({ tenantId: product!.tenantId }),
    enabled: !!product?.tenantId,
  });

  const { data: discountsData, isLoading: discountsLoading } = useQuery({
    queryKey: ['discounts', product?.tenantId, 'product-scope'],
    queryFn: () =>
      discountsApi.getAll({
        tenantId: product?.tenantId,
        isActive: true,
      }),
    enabled: !!product?.tenantId,
    select: (data) => ({
      ...data,
      data: data.data.filter((d) => d.scope === 'product'),
    }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductDto }) =>
      productsApi.update(id, data),
    onSuccess: () => {
      setIsEditing(false);
      editForm.reset();
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      toast.success('Produk berhasil diupdate');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const createStockMutation = useMutation({
    mutationFn: (data: { productId: string; outletId: string; quantity: number }) =>
      stocksApi.create(data),
    onSuccess: () => {
      setCreateStockModalOpen(false);
      setCreateStockQuantity(0);
      queryClient.invalidateQueries({ queryKey: ['stocks', productId, selectedOutlet?.id] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: (data: {
      productId: string;
      outletId: string;
      quantity: number;
      alasan: string;
      adjustedBy: string;
    }) => stockAdjustmentsApi.create(data),
    onSuccess: () => {
      setCreateStockModalOpen(false);
      setCreateStockQuantity(0);
      setAdjustmentReason('');
      queryClient.invalidateQueries({ queryKey: ['stocks', productId, selectedOutlet?.id] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments', productId] });
      toast.success('Stok berhasil disesuaikan');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const isLoading = productLoading || stocksLoading || adjustmentsLoading || discountsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (!product || (selectedTenant && product.tenantId !== selectedTenant.id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Produk tidak ditemukan</p>
        <Button variant="link" onClick={() => navigate({ to: '/products' })}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Kembali
        </Button>
      </div>
    );
  }

  const stocks = stocksData?.data || [];
  const adjustments = adjustmentsData?.data || [];
  const categories = categoriesData?.data || [];
  const discounts = discountsData?.data || [];

  const handleEdit = () => {
    editForm.reset({
      sku: product.sku,
      nama: product.nama,
      deskripsi: product.deskripsi || '',
      categoryId: product.categoryId?.toString() || 'none',
      hargaBeli: product.hargaBeli || '0',
      hargaJual: product.hargaJual || '0',
      minStockLevel: product.minStockLevel || 0,
      enableMinStock: product.enableMinStock || false,
      unit: product.unit,
      isActive: product.isActive,
      discountIds: product.discountProducts?.map((dp) => dp.discountId) || [],
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    editForm.reset();
    setIsEditing(false);
  };

  const getStockColor = (quantity: number) => {
    if (quantity <= 0) return 'bg-red-100 text-red-700';
    if (quantity <= product.minStockLevel) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  return (
    <div>
      <Button variant="link" onClick={() => navigate({ to: '/products' })} className="mb-4 pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Produk
      </Button>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{isEditing ? 'Edit Produk' : 'Detail Produk'}</CardTitle>
          {!isEditing && (
            <Button variant="outline" onClick={handleEdit}>
              <Edit2 className="mr-2 h-4 w-4" />
              Ubah
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isEditing ? (
            <Form {...editForm}>
              <form
                onSubmit={editForm.handleSubmit((v) =>
                  updateMutation.mutate({
                    id: productId,
                    data: {
                      ...v,
                      hargaBeli: v.hargaBeli || '0',
                      hargaJual: v.hargaJual || '0',
                      categoryId: v.categoryId && v.categoryId !== 'none' ? v.categoryId : null,
                    } as UpdateProductDto,
                  })
                )}
                className="space-y-4"
              >
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
                  name="nama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Produk</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={editForm.control}
                  name="deskripsi"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Deskripsi</FormLabel>
                      <FormControl>
                        <Textarea {...field} value={field.value || ''} />
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
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih kategori" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Tidak ada kategori</SelectItem>
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
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={editForm.control}
                    name="hargaBeli"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Harga Beli</FormLabel>
                        <FormControl>
                          <CurrencyInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Rp 0"
                          />
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
                          <CurrencyInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder="Rp 0"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="enableMinStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border px-4 py-3">
                        <div className="space-y-0.5">
                          <FormLabel>Notifikasi Minimum Stok</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {enableMinStock && (
                    <FormField
                      control={editForm.control}
                      name="minStockLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Batas Minimum Stok</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Masukkan batas minimum stok"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
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
                <div className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Status Aktif</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={editForm.control}
                  name="discountIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diskon Produk</FormLabel>
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        {discounts.length === 0 ? (
                          <p className="text-sm text-gray-500 col-span-2">
                            Tidak ada diskon produk tersedia
                          </p>
                        ) : (
                          discounts.map((discount) => {
                            const isSelected = field.value?.includes(discount.id);
                            return (
                              <div
                                key={discount.id}
                                onClick={() => {
                                  const currentIds = field.value || [];
                                  if (isSelected) {
                                    field.onChange(currentIds.filter((id) => id !== discount.id));
                                  } else {
                                    field.onChange([...currentIds, discount.id]);
                                  }
                                }}
                                className={`
                                  relative p-4 rounded-lg border-2 cursor-pointer transition-all
                                  ${
                                    isSelected
                                      ? 'border-gray-900 bg-gray-100'
                                      : 'border-gray-200 bg-white hover:border-gray-400'
                                  }
                                `}
                              >
                                <div className="flex items-start justify-between">
                                  <p className="font-semibold text-sm">{discount.nama}</p>
                                  <div
                                    className={`
                                      w-6 h-6 rounded-full flex items-center justify-center
                                      ${isSelected ? 'bg-gray-800 text-white' : 'bg-gray-200'}
                                    `}
                                  >
                                    {isSelected ? (
                                      <svg
                                        className="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                        aria-label="Selected"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M5 13l4 4L19 7"
                                        />
                                      </svg>
                                    ) : null}
                                  </div>
                                </div>
                                <div className="mt-3">
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-800">
                                    {discount.rate}%
                                  </span>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Batal
                  </Button>
                  <Button type="submit" disabled={updateMutation.isPending}>
                    Simpan
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
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
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 relative">
        {stocks.length === 0 && selectedOutlet && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
            <p className="text-gray-500 mb-4">Stok belum ada untuk outlet ini</p>
            <Button onClick={() => setCreateStockModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Stok
            </Button>
          </div>
        )}
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ringkasan Stok</CardTitle>
          {selectedOutlet &&
            (stocks.length > 0 ? (
              <Button size="sm" onClick={() => setCreateStockModalOpen(true)}>
                <Package className="h-4 w-4 mr-2" />
                Sesuaikan Stok
              </Button>
            ) : (
              <Button size="sm" onClick={() => setCreateStockModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Stok
              </Button>
            ))}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Jumlah Stok</p>
              <p className="text-2xl font-bold">
                {selectedOutlet
                  ? (stocks.find((s) => s.outletId === selectedOutlet.id)?.quantity ?? 0)
                  : stocks.reduce((sum, s) => sum + s.quantity, 0)}
              </p>
              <p className="text-xs text-gray-400">{product.unit}</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Minimum Stok</p>
              <p className="text-2xl font-bold">{product.minStockLevel}</p>
              <p className="text-xs text-gray-400">{product.unit}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {product.discountProducts && product.discountProducts.length > 0 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Diskon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {product.discountProducts.map((dp) => (
                <div
                  key={dp.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{dp.discount.nama}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs bg-gray-200 text-gray-800">
                    {dp.discount.rate}%
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="relative">
        <CardContent>
          {selectedOutlet ? (
            stocks.length > 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Riwayat Stok</h3>
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
              </>
            ) : null
          ) : (
            <Tabs defaultValue="stocks">
              <TabsList>
                <TabsTrigger value="stocks" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Stok ({stocks.length})
                </TabsTrigger>
                <TabsTrigger value="adjustments" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Riwayat ({adjustments.length})
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
                    {stocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                          Stok belum ada. Klik "Tambah Stok" untuk membuat.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stocks.map((stock) => (
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
                      ))
                    )}
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
          )}
        </CardContent>
      </Card>

      <Dialog open={createStockModalOpen} onOpenChange={setCreateStockModalOpen}>
        <DialogContent className="max-[400px]">
          <DialogHeader>
            <DialogTitle>{stocks.length > 0 ? 'Sesuaikan Stok' : 'Tambah Stok'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {stocks.length === 0 && selectedOutlet && (
              <div className="text-sm text-gray-500">
                Outlet:{' '}
                <span className="font-medium text-gray-900">
                  {selectedOutlet.nama} ({selectedOutlet.kode})
                </span>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">
                {stocks.length > 0 ? 'Jumlah Penyesuaian (negatif untuk mengurangi)' : 'Jumlah'}
              </label>
              <Input
                type="number"
                value={createStockQuantity}
                onChange={(e) => setCreateStockQuantity(Number(e.target.value))}
                className="mt-1"
                placeholder={stocks.length > 0 ? 'Contoh: 10 atau -5' : 'Contoh: 100'}
              />
              {stocks.length > 0 && createStockQuantity !== 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Stok akan berubah dari{' '}
                  <span className="font-medium">
                    {stocks.length > 0
                      ? (stocks.find((s) =>
                          selectedOutlet ? s.outletId === selectedOutlet.id : true
                        )?.quantity ?? 0)
                      : 0}
                  </span>{' '}
                  menjadi{' '}
                  <span className="font-medium text-green-600">
                    {(stocks.find((s) => (selectedOutlet ? s.outletId === selectedOutlet.id : true))
                      ?.quantity ?? 0) + createStockQuantity}
                  </span>
                </p>
              )}
            </div>
            {stocks.length > 0 && (
              <div>
                <label className="text-sm font-medium">Alasan</label>
                <Input
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="mt-1"
                  placeholder="Contoh: Koreksi stok, barang rusak, dll"
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={
                (stocks.length === 0 &&
                  (!selectedOutlet || createStockQuantity <= 0 || createStockMutation.isPending)) ||
                (stocks.length > 0 &&
                  (createStockQuantity === 0 ||
                    !adjustmentReason.trim() ||
                    !session?.user ||
                    adjustStockMutation.isPending))
              }
              onClick={() => {
                if (stocks.length === 0 && selectedOutlet) {
                  createStockMutation.mutate({
                    productId,
                    outletId: selectedOutlet.id,
                    quantity: createStockQuantity,
                  });
                } else {
                  const outletId = selectedOutlet?.id || stocks[0]?.outletId;
                  if (outletId && session?.user) {
                    adjustStockMutation.mutate({
                      productId,
                      outletId,
                      quantity: createStockQuantity,
                      alasan: adjustmentReason,
                      adjustedBy: session.user.id,
                    });
                  }
                }
              }}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
