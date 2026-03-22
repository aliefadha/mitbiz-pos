import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { OnboardingStepper } from '@/components/onboarding/onboarding-stepper';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { outletsApi } from '@/lib/api/outlets';
import { authClient } from '@/lib/auth-client';

const createOutletSchema = z.object({
  nama: z.string().min(1, 'Nama outlet wajib diisi').max(255, 'Nama outlet maksimal 255 karakter'),
  kode: z
    .string()
    .min(1, 'Kode outlet wajib diisi')
    .max(50, 'Kode outlet maksimal 50 karakter')
    .regex(/^[a-z0-9-]+$/, 'Kode hanya boleh huruf kecil, angka, dan tanda hubung (-)'),
  alamat: z.string().max(500, 'Alamat maksimal 500 karakter').optional(),
  noHp: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
});

type CreateOutletFormValues = z.infer<typeof createOutletSchema>;

function generateKode(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function CreateOutletOnboardingPage() {
  const navigate = useNavigate();

  const form = useForm<CreateOutletFormValues>({
    resolver: zodResolver(createOutletSchema),
    defaultValues: {
      nama: '',
      kode: '',
      alamat: '',
      noHp: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: CreateOutletFormValues) => {
      const session = await authClient.getSession();
      const tenantId = session.data?.user?.tenantId;

      if (!tenantId) {
        throw new Error('Tenant not found. Silakan buat bisnis terlebih dahulu.');
      }

      const outlet = await outletsApi.create({
        tenantId,
        nama: data.nama,
        kode: data.kode,
        alamat: data.alamat || undefined,
        noHp: data.noHp || undefined,
        isActive: true,
      });

      return outlet;
    },
    onSuccess: () => {
      toast.success('Outlet berhasil dibuat!');
      navigate({ to: '/onboarding/success' });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat outlet');
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    createMutation.mutate(values);
  });

  const handleNameChange = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    const currentKode = form.getValues('kode');
    const expectedKode = generateKode(form.getValues('nama'));
    if (!currentKode || currentKode === expectedKode) {
      form.setValue('kode', generateKode(value), { shouldValidate: true });
    }
  };

  return (
    <div className="space-y-0">
      {/* Stepper */}
      <OnboardingStepper currentStep={3} />

      {/* Header */}
      <div className="mb-5 lg:mb-6">
        <h2 className="text-lg md:text-xl lg:text-xl font-bold tracking-tight text-gray-900">
          Setup Outlet Pertama
        </h2>
        <p className="mt-1.5 text-xs lg:text-sm leading-relaxed text-gray-500">
          Outlet adalah lokasi kasir Anda. Anda bisa
          <br />
          menambah lebih banyak nanti.
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
                    Nama Outlet <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Contoh : Cabang Utama"
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
              name="alamat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">Alamat Outlet</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Jl. Abu Hanifah No.8, Padang Panjang"
                      className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
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
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Nomor Telepon Outlet
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="+62 875-0000-0000"
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
              onClick={() => navigate({ to: '/onboarding/create-tenant' })}
              className="flex-1 h-10 lg:h-12 rounded-full border-gray-200 text-sm lg:text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 gap-2"
            >
              <ChevronLeft className="h-4 w-4" />
              Kembali
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="flex-1 h-10 lg:h-12 rounded-full bg-blue-600 text-sm lg:text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] gap-2"
            >
              {createMutation.isPending ? 'Menyimpan...' : 'Buat Akun'}
              {!createMutation.isPending && <ChevronRight className="h-4 w-4" />}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

export const Route = createFileRoute('/_onboarding/onboarding/create-outlet')({
  component: CreateOutletOnboardingPage,
  beforeLoad: async ({ context }) => {
    const { tenantId } = context.session.user;
    if (!tenantId) {
      throw redirect({ to: '/onboarding/create-tenant' });
    }
  },
});
