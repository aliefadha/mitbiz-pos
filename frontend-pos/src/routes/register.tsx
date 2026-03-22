import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { createFileRoute, Link, redirect } from '@tanstack/react-router';
import { Check, ChevronLeft, ChevronRight, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { RegisterStepper } from '@/components/register/register-stepper';
import { Badge } from '@/components/ui/badge';
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
import { registerApi } from '@/lib/api/register';
import { usersApi } from '@/lib/api/users';
import { authClient } from '@/lib/auth-client';

const accountSchema = z
  .object({
    name: z.string().min(1, 'Nama lengkap wajib diisi').max(255),
    email: z.string().min(1, 'Email wajib diisi').email('Format email tidak valid'),
    password: z
      .string()
      .min(8, 'Password minimal 8 karakter')
      .max(100, 'Password maksimal 100 karakter'),
    confirmPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Password dan konfirmasi password tidak cocok',
    path: ['confirmPassword'],
  });

const tenantSchema = z.object({
  nama: z.string().min(1, 'Nama bisnis wajib diisi').max(255, 'Nama bisnis maksimal 255 karakter'),
  slug: z
    .string()
    .min(1, 'Slug wajib diisi')
    .max(100, 'Slug maksimal 100 karakter')
    .regex(/^[a-zA-Z0-9-]+$/, 'Slug hanya boleh huruf, angka, dan tanda hubung (-)'),
  alamat: z.string().max(500, 'Alamat maksimal 500 karakter').optional(),
  noHp: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
});

const outletSchema = z.object({
  nama: z.string().min(1, 'Nama outlet wajib diisi').max(255, 'Nama outlet maksimal 255 karakter'),
  kode: z
    .string()
    .min(1, 'Kode outlet wajib diisi')
    .max(50, 'Kode outlet maksimal 50 karakter')
    .regex(/^[a-zA-Z0-9-]+$/, 'Kode hanya boleh huruf, angka, dan tanda hubung (-)'),
  alamat: z.string().max(500, 'Alamat maksimal 500 karakter').optional(),
  noHp: z.string().max(20, 'Nomor telepon maksimal 20 karakter').optional(),
});

type AccountFormValues = z.infer<typeof accountSchema>;
type TenantFormValues = z.infer<typeof tenantSchema>;
type OutletFormValues = z.infer<typeof outletSchema>;

export const Route = createFileRoute('/register')({
  component: RegisterPage,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (session) {
      throw redirect({ to: '/dashboard' });
    }
  },
});

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function generateKode(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function RegisterPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [accountData, setAccountData] = useState<AccountFormValues | null>(null);
  const [tenantData, setTenantData] = useState<TenantFormValues | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const accountForm = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const tenantForm = useForm<TenantFormValues>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      nama: '',
      slug: '',
      alamat: '',
      noHp: '',
    },
  });

  const outletForm = useForm<OutletFormValues>({
    resolver: zodResolver(outletSchema),
    defaultValues: {
      nama: '',
      kode: '',
      alamat: '',
      noHp: '',
    },
  });

  const emailCheckMutation = useMutation({
    mutationFn: async (email: string) => {
      const result = await usersApi.checkEmail(email);
      return result;
    },
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      if (!accountData || !tenantData) {
        throw new Error('Data tidak lengkap');
      }

      const outletValues = outletForm.getValues();

      const result = await registerApi.registerComplete({
        account: {
          name: accountData.name,
          email: accountData.email,
          password: accountData.password,
        },
        tenant: {
          nama: tenantData.nama,
          slug: tenantData.slug,
          alamat: tenantData.alamat || undefined,
          noHp: tenantData.noHp || undefined,
        },
        outlet: {
          nama: outletValues.nama,
          kode: outletValues.kode,
          alamat: outletValues.alamat || undefined,
          noHp: outletValues.noHp || undefined,
        },
      });

      return result;
    },
    onSuccess: () => {
      setRegistrationComplete(true);
      setCurrentStep(4);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mendaftar');
    },
  });

  const handleAccountSubmit = accountForm.handleSubmit(async (values) => {
    setEmailError(null);

    try {
      const result = await emailCheckMutation.mutateAsync(values.email);
      if (result.exists) {
        setEmailError('Email sudah terdaftar');
        return;
      }

      setAccountData(values);
      setCurrentStep(2);
    } catch (error) {
      setEmailError('Gagal memverifikasi email');
    }
  });

  const handleTenantSubmit = tenantForm.handleSubmit((values) => {
    setTenantData(values);
    setCurrentStep(3);
  });

  const handleOutletSubmit = outletForm.handleSubmit(() => {
    registerMutation.mutate();
  });

  const handleBack = () => {
    if (currentStep === 2) {
      setCurrentStep(1);
    } else if (currentStep === 3) {
      setCurrentStep(2);
    }
  };

  const handleNameChange = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    const currentSlug = tenantForm.getValues('slug');
    const expectedSlug = generateSlug(tenantForm.getValues('nama'));
    if (!currentSlug || currentSlug === expectedSlug) {
      tenantForm.setValue('slug', generateSlug(value), { shouldValidate: true });
    }
  };

  const handleOutletNameChange = (value: string, onChange: (value: string) => void) => {
    onChange(value);
    const currentKode = outletForm.getValues('kode');
    const expectedKode = generateKode(outletForm.getValues('nama'));
    if (!currentKode || currentKode === expectedKode) {
      outletForm.setValue('kode', generateKode(value), { shouldValidate: true });
    }
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-linear-to-br from-[#0a1e5c] via-[#0d2a6e] to-[#1a4fa0] py-6 lg:py-10">
      <div className="relative hidden md:flex md:flex-col flex-1 h-full md:w-5/12 lg:w-1/2">
        <div className="relative z-10 flex flex-col h-full px-6 lg:px-10">
          <div>
            <img src="/images/logo-login.png" className="w-28 lg:w-40 h-auto" />
          </div>

          <div className="flex-1 flex items-center">
            <div>
              <h1 className="mb-4 lg:mb-6 text-[1.25rem] lg:text-[2.5rem] leading-[1.15] font-bold tracking-tight text-white font-sans">
                Sistem Kasir Multi Cabang
                <br />
                yang Lebih Terkontrol
              </h1>
              <div className="flex flex-wrap gap-2 md:gap-3 font-sans">
                <Badge
                  variant="outline"
                  className="rounded-full border-[#0C73E0] px-3 md:px-4 py-1 md:py-1.5 text-xs lg:text-sm font-medium text-white backdrop-blur-sm"
                >
                  Transaksi Real-time
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full border-[#0C73E0] px-3 md:px-4 py-1 md:py-1.5 text-xs lg:text-sm font-medium text-white backdrop-blur-sm"
                >
                  Manajemen Stok Otomatis
                </Badge>
                <Badge
                  variant="outline"
                  className="rounded-full border-[#0C73E0] px-3 md:px-4 py-1 md:py-1.5 text-xs lg:text-sm font-medium text-white backdrop-blur-sm"
                >
                  Laporan Per Cabang
                </Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute -bottom-10 -left-8 z-0 h-[300px] w-[300px] lg:h-[450px] lg:w-[450px]">
          <img src="/images/login.png" className="h-full w-full object-cover" />
        </div>

        <div className="pointer-events-none absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-24 left-1/4 h-[400px] w-[400px] rounded-full bg-blue-300/8 blur-[100px]" />
      </div>

      <div className="flex flex-col w-full h-full px-6 md:w-7/12 lg:w-1/2 font-sans">
        <div className="flex-1 flex flex-col justify-center w-full max-w-[500px] lg:max-w-[700px] mx-auto rounded-2xl bg-white p-5 px-10 shadow-sm overflow-y-auto">
          <RegisterStepper currentStep={currentStep} />

          {!registrationComplete && (
            <div className="mb-5 lg:mb-8">
              <h2 className="text-lg md:text-xl lg:text-xl font-bold tracking-tight text-gray-900">
                {currentStep === 1 && 'Informasi Akun'}
                {currentStep === 2 && 'Informasi Bisnis'}
                {currentStep === 3 && 'Informasi Outlet'}
              </h2>
              <p className="mt-1.5 lg:mt-2 text-xs lg:text-sm leading-relaxed text-gray-500">
                {currentStep === 1 && 'Buat akun untuk mulai mengelola bisnis Anda.'}
                {currentStep === 2 && 'Isi detail bisnis Anda untuk personalisasi pengalaman POS.'}
                {currentStep === 3 && 'Tambahkan outlet pertama Anda.'}
              </p>
            </div>
          )}

          {currentStep === 1 && (
            <Form {...accountForm}>
              <form onSubmit={handleAccountSubmit} className="space-y-4">
                <FormField
                  control={accountForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Nama Lengkap <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Masukkan nama lengkap"
                          {...field}
                          className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={accountForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="nama@email.com"
                          type="email"
                          {...field}
                          className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                      {emailError && <p className="text-sm text-red-500 mt-1">{emailError}</p>}
                    </FormItem>
                  )}
                />

                <FormField
                  control={accountForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Password <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Minimal 8 karakter"
                            type={showPassword ? 'text' : 'password'}
                            {...field}
                            className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 pr-10 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={accountForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Konfirmasi Password <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder="Ulangi password Anda"
                            type={showConfirmPassword ? 'text' : 'password'}
                            {...field}
                            className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 pr-10 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={emailCheckMutation.isPending}
                    className="h-10 lg:h-12 w-full rounded-full bg-blue-600 text-sm lg:text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] gap-2"
                  >
                    {emailCheckMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      <>
                        Selanjutnya
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>

                <p className="pt-2 text-center text-sm text-gray-500">
                  Sudah punya akun?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    Masuk di sini
                  </Link>
                </p>
              </form>
            </Form>
          )}

          {currentStep === 2 && (
            <Form {...tenantForm}>
              <form onSubmit={handleTenantSubmit} className="space-y-4">
                <FormField
                  control={tenantForm.control}
                  name="nama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Nama Bisnis <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: Bisnis Jakarta Pusat"
                          {...field}
                          onChange={(e) => handleNameChange(e.target.value, field.onChange)}
                          className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={tenantForm.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Kode <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="contoh-slug-bisnis"
                          {...field}
                          className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-400">
                        URL identifier unik, hanya huruf, angka, dan tanda hubung
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={tenantForm.control}
                  name="alamat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Alamat</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masukkan alamat lengkap bisnis"
                          {...field}
                          className="min-h-20 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={tenantForm.control}
                  name="noHp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Nomor Telepon
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh: 021-12345678"
                          {...field}
                          className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-10 lg:h-12 rounded-full border-gray-200 text-sm lg:text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 h-10 lg:h-12 rounded-full bg-blue-600 text-sm lg:text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] gap-2"
                  >
                    Selanjutnya
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {currentStep === 3 && (
            <Form {...outletForm}>
              <form onSubmit={handleOutletSubmit} className="space-y-4">
                <FormField
                  control={outletForm.control}
                  name="nama"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Nama Outlet <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Contoh : Outlet Utama"
                          {...field}
                          onChange={(e) => handleOutletNameChange(e.target.value, field.onChange)}
                          className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={outletForm.control}
                  name="kode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Kode Outlet <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="contoh-outlet"
                          {...field}
                          className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormDescription className="text-xs text-gray-400">
                        Identifier unik outlet, hanya huruf, angka, dan tanda hubung
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={outletForm.control}
                  name="alamat"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">Alamat</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jl. Abu Hanifah No.8, Padang Panjang"
                          {...field}
                          className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={outletForm.control}
                  name="noHp"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-700">
                        Nomor Telepon
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="+62 875-0000-0000"
                          {...field}
                          className="h-9 lg:h-11 rounded-lg border-gray-200 bg-white px-4 text-sm placeholder:text-gray-400 focus-visible:ring-blue-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="flex-1 h-10 lg:h-12 rounded-full border-gray-200 text-sm lg:text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-800 gap-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Kembali
                  </Button>
                  <Button
                    type="submit"
                    disabled={registerMutation.isPending}
                    className="flex-1 h-10 lg:h-12 rounded-full bg-blue-600 text-sm lg:text-base font-semibold text-white shadow-md transition-all hover:bg-blue-700 hover:shadow-lg active:scale-[0.98] gap-2"
                  >
                    {registerMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Membuat...
                      </>
                    ) : (
                      <>
                        Buat Akun
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          )}

          {registrationComplete && (
            <div className="flex flex-1 flex-col items-center justify-center py-8 lg:py-12">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-50">
                <Check className="h-10 w-10 text-green-500" />
              </div>
              <h2 className="mb-3 text-xl lg:text-2xl font-bold tracking-tight text-gray-900">
                Akun Berhasil Dibuat! 🎉
              </h2>
              <p className="mb-8 max-w-sm text-center text-sm leading-relaxed text-gray-500">
                Selamat datang di Mitbiz POS. Bisnis Anda sudah siap untuk dikelola.
              </p>
              <Button
                onClick={() => {
                  window.location.href = '/login';
                }}
                className="h-12 w-full max-w-sm rounded-full text-base font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
              >
                Mulai Mitbiz POS
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
