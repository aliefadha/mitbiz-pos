import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
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
import { categoriesApi } from '@/lib/api/categories';
import { type CreateProductDto, productsApi } from '@/lib/api/products';
import { checkPermissionWithScope } from '@/lib/permissions';
import { useSessionWithCache } from '@/lib/session-cache';

const formSchema = z.object({
  sku: z.string().min(1, 'SKU wajib diisi'),
  nama: z.string().min(1, 'Nama produk wajib diisi'),
  deskripsi: z.string().optional(),
  categoryId: z.string().optional(),
  hargaBeli: z.string(),
  hargaJual: z.string().min(1, 'Harga jual wajib diisi'),
  unit: z.string(),
  minStockLevel: z.number(),
  enableMinStock: z.boolean(),
  enableStockTracking: z.boolean(),
});

export function CreateProductPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: session } = useSessionWithCache();
  const tenantId = session?.user?.tenantId;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
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
    },
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', tenantId],
    queryFn: () => categoriesApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateProductDto) => productsApi.create(data),
    onSuccess: () => {
      toast.success('Produk berhasil dibuat');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate({ to: '/products' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat produk');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    const productData = {
      ...values,
      categoryId: values.categoryId && values.categoryId !== 'none' ? values.categoryId : null,
      hargaBeli: values.hargaBeli || '0',
      hargaJual: values.hargaJual || '0',
      tenantId: tenantId!,
      isActive: true,
      enableMinStock: values.enableMinStock,
      enableStockTracking: values.enableStockTracking,
    };

    createMutation.mutate(productData as CreateProductDto);
  });

  const categories = categoriesData?.data ?? [];
  const enableMinStock = form.watch('enableMinStock');
  const enableStockTracking = form.watch('enableStockTracking');

  if (categoriesLoading) {
    return (
      <div className="flex justify-center p-10">
        <Skeleton className="h-10 w-full max-w-md" />
      </div>
    );
  }

  return (
    <div>
      <Button variant="link" onClick={() => navigate({ to: '/products' })} className="mb-4 pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Daftar Produk
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Tambah Produk Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan SKU" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Produk</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama produk" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deskripsi"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Deskripsi</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Masukkan deskripsi (opsional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormField
                  control={form.control}
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="hargaBeli"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Beli</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="hargaJual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Harga Jual</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="enableStockTracking"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border px-4 py-3">
                      <FormLabel>Tracking Stok</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
                    control={form.control}
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
                control={form.control}
                name="unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Satuan</FormLabel>
                    <FormControl>
                      <Input placeholder="pcs" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 pt-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => navigate({ to: '/products' })}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Kembali
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  {createMutation.isPending ? 'Menyimpan...' : 'Simpan Produk'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/products/new')({
  component: CreateProductPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('products', 'create', 'tenant');
  },
});
