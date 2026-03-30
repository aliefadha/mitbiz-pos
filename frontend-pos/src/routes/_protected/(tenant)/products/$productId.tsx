import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Edit2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ProductStockSection } from '@/components/products/product-stock-section';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CurrencyInput } from '@/components/ui/currency-input';
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
import { Textarea } from '@/components/ui/textarea';
import { usePermissions } from '@/hooks/use-auth';
import { categoriesApi } from '@/lib/api/categories';
import { discountsApi } from '@/lib/api/discounts';
import { productsApi, type UpdateProductDto } from '@/lib/api/products';
import { checkPermissionWithScope } from '@/lib/permissions';

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
  enableStockTracking: z.boolean(),
  unit: z.string(),
  discountIds: z.array(z.string()).optional(),
});

function ProductDetailPage() {
  const { productId } = useParams({ from: '/_protected/(tenant)/products/$productId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [isEditing, setIsEditing] = useState(false);

  const canUpdate = hasPermission('products', 'update');

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
      enableStockTracking: true,
      discountIds: [],
    },
  });

  const enableMinStock = editForm.watch('enableMinStock');
  const enableStockTracking = editForm.watch('enableStockTracking');

  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: () => productsApi.getById(productId),
    enabled: !!productId,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', product?.tenantId],
    queryFn: () => categoriesApi.getAll({ tenantId: product!.tenantId }),
    enabled: !!product?.tenantId,
  });

  const { data: discountsData } = useQuery({
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

  if (productLoading) {
    return (
      <div className="flex justify-center py-24">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (!product) {
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
      enableStockTracking: product.enableStockTracking ?? true,
      unit: product.unit,
      discountIds: product.discountProducts?.map((dp) => dp.discountId) || [],
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    editForm.reset();
    setIsEditing(false);
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
          {!isEditing && canUpdate && (
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
                    name="enableStockTracking"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border px-4 py-3">
                        <FormLabel> Tracking Stok</FormLabel>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="enableMinStock"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-md border px-4 py-3">
                        <div className="space-y-0.5">
                          <FormLabel>Notifikasi Minimum Stok</FormLabel>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={!enableStockTracking}
                          />
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
                <code className="bg-gray-100 px-2 py-1 rounded">{product.sku || '-'}</code>
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
                <span className="text-gray-500">Tracking Stok:</span>{' '}
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    product.enableStockTracking !== false
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {product.enableStockTracking !== false ? 'Aktif' : 'Nonaktif'}
                </span>
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

      <ProductStockSection product={product} />
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/products/$productId')({
  component: ProductDetailPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('products', 'read', 'tenant');
  },
});
