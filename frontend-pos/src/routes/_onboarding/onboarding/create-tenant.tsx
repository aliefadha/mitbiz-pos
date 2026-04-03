import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { ChevronRight, LogOut } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper';
import { Button } from '@/components/ui/button';
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
import { Textarea } from '@/components/ui/textarea';
import { tenantsApi } from '@/lib/api/tenants';
import { signOut } from '@/lib/auth-client';

const createTenantSchema = z.object({
  nama: z.string().min(1, 'Nama bisnis wajib diisi').max(255, 'Nama bisnis maksimal 255 karakter'),
  slug: z
    .string()
    .min(1, 'Slug wajib diisi')
    .max(100, 'Slug maksimal 100 karakter')
    .regex(/^[a-z0-9-]+$/, 'Slug hanya boleh huruf kecil, angka, dan tanda hubung (-)'),
  alamat: z.string().max(500, 'Alamat maksimal 500 karakter').optional(),
  noHp: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
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

function CreateTenantOnboardingPage() {
  const navigate = useNavigate();

  const form = useForm<CreateTenantFormValues>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      nama: '',
      slug: '',
      alamat: '',
      noHp: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateTenantFormValues) => {
      const tenant = await tenantsApi.create({
        nama: data.nama,
        slug: data.slug,
        alamat: data.alamat || undefined,
        noHp: data.noHp || undefined,
        isActive: true,
        taxRate: '11',
        receiptFooter: 'Terima kasih telah berbelanja',
      });

      return tenant;
    },
    onSuccess: () => {
      toast.success('Bisnis berhasil dibuat');
      navigate({ to: '/onboarding/create-outlet' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat bisnis');
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

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="space-y-0">
      {/* Stepper */}
      <OnboardingStepper currentStep={2} />

      {/* Header */}
      <div className="mb-5 lg:mb-6">
        <h2 className="text-lg md:text-xl lg:text-xl font-bold tracking-tight text-gray-900">
          Informasi Bisnis
        </h2>
        <p className="mt-1.5 text-xs lg:text-sm leading-relaxed text-gray-500">
          Isi detail bisnis Anda untuk personalisasi pengalaman POS.
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="nama"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Nama Bisnis <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: Bisnis Jakarta Pusat"
                      className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
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
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Kode <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="contoh-slug-bisnis"
                      className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-gray-400">
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
                  <FormLabel className="text-sm font-medium text-gray-700">Alamat</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Masukkan alamat lengkap bisnis"
                      className="min-h-20 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
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
                  <FormLabel className="text-sm font-medium text-gray-700">Nomor Telepon</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh: 021-12345678"
                      className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleSignOut}
              className="flex-1 h-10 lg:h-12 rounded-full border-gray-200 text-sm lg:text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 gap-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 h-10 lg:h-12 rounded-full bg-blue-600 text-sm lg:text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] gap-2"
            >
              {createMutation.isPending ? 'Menyimpan...' : 'Lanjut ke Outlet'}
              {!createMutation.isPending && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export const Route = createFileRoute('/_onboarding/onboarding/create-tenant')({
  component: CreateTenantOnboardingPage,
  beforeLoad: async ({ context }) => {
    const { roleScope, tenantId } = context.session.user;
    if (roleScope === 'global' || tenantId) {
      throw redirect({ to: '/' });
    }
  },
});
