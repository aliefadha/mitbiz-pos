import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Eye, EyeOff, Save, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
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
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { type SubscriptionPlan, subscriptionPlansApi } from '@/lib/api/subscriptions';
import { tenantsApi } from '@/lib/api/tenants';
import { checkPermissionWithScope } from '@/lib/permissions';

const createTenantSchema = z.object({
  nama: z.string().min(1, 'Nama tenant wajib diisi').max(255, 'Nama tenant maksimal 255 karakter'),
  slug: z
    .string()
    .min(1, 'Slug wajib diisi')
    .max(100, 'Slug maksimal 100 karakter')
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-)'),
  alamat: z.string().max(500, 'Alamat maksimal 500 karakter').optional(),
  noHp: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
  taxRate: z.number().min(0, 'Minimal 0').max(100, 'Maksimal 100'),
  receiptFooter: z.string().optional(),
  isActive: z.boolean(),
  ownerName: z.string().min(1, 'Nama pemilik wajib diisi'),
  ownerEmail: z.string().email('Masukkan email yang valid'),
  ownerPassword: z.string().min(8, 'Password minimal 8 karakter'),
  planId: z.string().optional(),
  billingCycle: z.enum(['monthly', 'quarterly', 'semi_annual', 'yearly']).optional(),
});

type CreateTenantFormValues = z.infer<typeof createTenantSchema>;

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function CreateTenantPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

  const { data: plansResponse } = useQuery({
    queryKey: ['subscription-plans', 'active'],
    queryFn: () => subscriptionPlansApi.getAll({ isActive: true, limit: 100 }),
  });

  const plans: SubscriptionPlan[] = plansResponse?.data || [];

  const form = useForm<CreateTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      nama: '',
      slug: '',
      alamat: '',
      noHp: '',
      taxRate: 0,
      receiptFooter: 'Terima kasih telah berbelanja',
      isActive: true,
      ownerName: '',
      ownerEmail: '',
      ownerPassword: '',
      planId: '',
      billingCycle: undefined,
    },
  });

  const selectedPlan = plans.find((p) => p.id === form.watch('planId'));
  const availableCycles = selectedPlan?.billingCycles || [];

  const createMutation = useMutation({
    mutationFn: async (data: CreateTenantFormValues) => {
      const tenant = await tenantsApi.create({
        nama: data.nama,
        slug: data.slug,
        ownerName: data.ownerName,
        ownerEmail: data.ownerEmail,
        ownerPassword: data.ownerPassword,
        alamat: data.alamat || undefined,
        noHp: data.noHp || undefined,
        isActive: data.isActive,
        taxRate: String(data.taxRate),
        receiptFooter: data.receiptFooter || 'Terima kasih telah berbelanja',
        planId: data.planId || undefined,
        billingCycle: data.billingCycle || undefined,
      });

      return tenant;
    },
    onSuccess: () => {
      toast.success('Tenant dan pemilik berhasil dibuat');
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      navigate({ to: '/tenants' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat tenant');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    createMutation.mutate(values);
  });

  const handleNameChange = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    const currentSlug = form.getValues('slug');
    const expectedSlug = generateSlug(form.getValues('nama'));
    if (!currentSlug || currentSlug === expectedSlug) {
      form.setValue('slug', generateSlug(value), { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      <Button
        variant="link"
        onClick={() => navigate({ to: '/tenants' })}
        className="pl-0 text-gray-500"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Manajemen Bisnis
      </Button>

      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tambah Bisnis Baru</h1>
        <p className="text-sm text-gray-500 mt-1">
          Isi informasi bisnis dan data pemilik untuk menambahkan bisnis baru ke sistem
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Card>
            <CardContent className="space-y-5">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-semibold text-gray-900">Pemilik Bisnis</h2>
              </div>
              <p className="text-sm text-gray-500 -mt-2">
                Buat akun pemilik yang akan mengelola bisnis ini
              </p>

              <Separator />

              <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                <FormField
                  control={form.control}
                  name="ownerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nama Pemilik <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Nama lengkap pemilik" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Email <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@contoh.com" {...field} />
                      </FormControl>
                      <FormDescription>Email ini akan digunakan untuk login</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ownerPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Password <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Minimal 8 karakter"
                            {...field}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="py-5 gap-0">
            <CardContent className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Informasi Bisnis</h2>

              <div className="grid grid-cols-1 gap-x-6 gap-y-5">
                <FormField
                  control={form.control}
                  name="nama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nama Bisnis <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Bisnis Jakarta Pusat"
                          {...field}
                          onChange={(e) => handleNameChange(e.target.value, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Slug <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="contoh-slug-bisnis" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL identifier unik, hanya huruf kecil, angka, dan tanda hubung
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="alamat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alamat</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan alamat lengkap bisnis"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="noHp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Telepon</FormLabel>
                      <FormControl>
                        <Input placeholder="Contoh: 021-12345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border px-4 py-3">
                      <div className="space-y-0.5">
                        <FormLabel>Status Aktif</FormLabel>
                        <FormDescription>
                          Bisnis akan aktif dan dapat digunakan setelah dibuat
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="py-5 gap-0">
            <CardContent className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Pengaturan</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                <FormField
                  control={form.control}
                  name="planId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Paket Langganan</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue('billingCycle', undefined);
                        }}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih paket langganan" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {plans.map((plan) => (
                            <SelectItem key={plan.id} value={plan.id}>
                              {plan.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>Pilih paket langganan untuk bisnis ini</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="billingCycle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Durasi</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={!selectedPlan}
                      >
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih durasi" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {availableCycles.map((cycle) => (
                            <SelectItem key={cycle.cycle} value={cycle.cycle}>
                              {cycle.cycle === 'monthly'
                                ? 'Bulanan'
                                : cycle.cycle === 'quarterly'
                                  ? '3 Bulanan'
                                  : cycle.cycle === 'semi_annual'
                                    ? '6 Bulanan'
                                    : 'Tahunan'}{' '}
                              - Rp {Number(cycle.price).toLocaleString('id-ID')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        {selectedPlan
                          ? 'Pilih metode pembayaran'
                          : 'Pilih paket langganan terlebih dahulu'}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="taxRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tarif Pajak (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.1}
                          placeholder="0"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Persentase pajak yang diterapkan pada transaksi
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receiptFooter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Struk</FormLabel>
                      <FormControl>
                        <Input placeholder="Terima kasih telah berbelanja" {...field} />
                      </FormControl>
                      <FormDescription>Pesan yang tampil di bagian bawah struk</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: '/tenants' })}
              className="px-6"
            >
              Batal
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="gap-2 px-6">
              <Save className="h-4 w-4" />
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Bisnis'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export const Route = createFileRoute('/_protected/(global)/tenants/new')({
  component: CreateTenantPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('tenants', 'create', 'global');
  },
});
