import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
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
import { rolesApi } from '@/lib/api/roles';
import { tenantsApi } from '@/lib/api/tenants';
import { usersApi } from '@/lib/api/users';

// ─── Form Schema ──────────────────────────────────────────────────────────────

const createTenantSchema = z.object({
  // Tenant fields
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

  // Owner fields
  ownerName: z.string().min(1, 'Nama pemilik wajib diisi'),
  ownerEmail: z.string().email('Masukkan email yang valid'),
  ownerPassword: z.string().min(8, 'Password minimal 8 karakter'),
  ownerRoleId: z.string().min(1, 'Role wajib dipilih'),
});

type CreateTenantFormValues = z.infer<typeof createTenantSchema>;

// ─── Slug Generator ───────────────────────────────────────────────────────────

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateTenantPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showPassword, setShowPassword] = useState(false);

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
      ownerRoleId: '',
    },
  });

  // Fetch tenant-scoped roles for the owner role selector
  const { data: roles = [] } = useQuery({
    queryKey: ['roles', 'tenant'],
    queryFn: () => rolesApi.getAll({ scope: 'tenant' }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateTenantFormValues) => {
      // Step 1: Create the owner user
      const userResult = await usersApi.createUser({
        name: data.ownerName,
        email: data.ownerEmail,
        password: data.ownerPassword,
        roleId: data.ownerRoleId,
        isSubscribed: true,
      });

      // Extract the user from the response shape { user: User }
      const createdUser = (userResult as any).user || userResult;

      // Step 2: Create the tenant linked to the new user
      const tenant = await tenantsApi.create({
        nama: data.nama,
        slug: data.slug,
        userId: createdUser.id,
        alamat: data.alamat || undefined,
        noHp: data.noHp || undefined,
        isActive: data.isActive,
        settings: {
          currency: 'IDR',
          timezone: 'Asia/Jakarta',
          taxRate: data.taxRate,
          receiptFooter: data.receiptFooter || 'Terima kasih telah berbelanja',
        },
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

  // Auto-generate slug from nama
  const handleNameChange = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    const currentSlug = form.getValues('slug');
    const expectedSlug = generateSlug(form.getValues('nama'));
    // Only auto-update slug if it hasn't been manually edited
    if (!currentSlug || currentSlug === expectedSlug) {
      form.setValue('slug', generateSlug(value), { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Button
        variant="link"
        onClick={() => navigate({ to: '/tenants' })}
        className="pl-0 text-gray-500"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke Manajemen Cabang
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tambah Tenant Baru</h1>
        <p className="text-sm text-gray-500 mt-1">
          Isi informasi tenant dan data pemilik untuk menambahkan cabang baru ke sistem
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* ── Pemilik (Owner) Section ─────────────────────────────────────── */}
          <Card className="py-5 gap-0">
            <CardContent className="space-y-5">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-500" />
                <h2 className="text-base font-semibold text-gray-900">Pemilik Tenant</h2>
              </div>
              <p className="text-sm text-gray-500 -mt-2">
                Buat akun pemilik yang akan mengelola tenant ini
              </p>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Nama Pemilik */}
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

                {/* Email Pemilik */}
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

                {/* Password Pemilik */}
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

                {/* Role */}
                <FormField
                  control={form.control}
                  name="ownerRoleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Role <span className="text-red-500">*</span>
                      </FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Pilih role untuk pemilik" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              {role.name}
                              {role.description && (
                                <span className="text-gray-400 ml-1">— {role.description}</span>
                              )}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Role menentukan hak akses pengguna pada tenant
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* ── Informasi Dasar Section ─────────────────────────────────────── */}
          <Card className="py-5 gap-0">
            <CardContent className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Informasi Tenant</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Nama Tenant */}
                <FormField
                  control={form.control}
                  name="nama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Nama Tenant <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Cabang Jakarta Pusat"
                          {...field}
                          onChange={(e) => handleNameChange(e.target.value, field.onChange)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Slug */}
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Slug <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="contoh-slug-tenant" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL identifier unik, hanya huruf kecil, angka, dan tanda hubung
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Alamat */}
                <FormField
                  control={form.control}
                  name="alamat"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Alamat</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan alamat lengkap tenant"
                          className="min-h-20"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* No HP */}
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

                {/* Status Aktif */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-md border px-4 py-3">
                      <div className="space-y-0.5">
                        <FormLabel>Status Aktif</FormLabel>
                        <FormDescription>
                          Tenant akan aktif dan dapat digunakan setelah dibuat
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

          {/* ── Pengaturan Section ──────────────────────────────────────────── */}
          <Card className="py-5 gap-0">
            <CardContent className="space-y-5">
              <h2 className="text-base font-semibold text-gray-900">Pengaturan</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                {/* Tarif Pajak */}
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

                {/* Footer Struk */}
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

          {/* ── Action Buttons ──────────────────────────────────────────────── */}
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
              {createMutation.isPending ? 'Menyimpan...' : 'Simpan Tenant'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
