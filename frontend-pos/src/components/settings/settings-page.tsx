import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Lock, Mail, Save, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usersApi } from '@/lib/api/users';
import { authClient } from '@/lib/auth-client';

interface SettingsFormData {
  appName: string;
  defaultLanguage: string;
  logoFile: File | null;
  timezone: string;
  defaultCurrency: string;
  dateFormat: string;
}

const initialFormData: SettingsFormData = {
  appName: 'Mitbis POS',
  defaultLanguage: 'id',
  logoFile: null,
  timezone: 'Asia/Jakarta',
  defaultCurrency: 'IDR',
  dateFormat: 'DD/MM/YYYY',
};

const languages = [
  { value: 'id', label: 'Indonesia' },
  { value: 'en', label: 'English' },
];

const timezones = [
  { value: 'Asia/Jakarta', label: 'GMT +7 Jakarta' },
  { value: 'Asia/Makassar', label: 'GMT +8 Makassar' },
  { value: 'Asia/Jayapura', label: 'GMT +9 Jayapura' },
];

const currencies = [
  { value: 'IDR', label: 'Rupiah (IDR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
];

const dateFormats = [
  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
];

const akunFormSchema = z.object({
  name: z.string().min(1, 'Nama wajib diisi'),
});

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Password lama wajib diisi'),
    newPassword: z.string().min(8, 'Password baru minimal 8 karakter'),
    confirmNewPassword: z.string().min(1, 'Konfirmasi password wajib diisi'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Password tidak cocok',
    path: ['confirmNewPassword'],
  });

function ChangePasswordForm() {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<z.infer<typeof changePasswordSchema>>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmNewPassword: '',
    },
  });

  const changePasswordMutation = useMutation({
    mutationFn: async (data: z.infer<typeof changePasswordSchema>) => {
      const { error } = await authClient.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        revokeOtherSessions: true,
      });

      if (error) {
        throw new Error(error.message || 'Gagal mengubah password');
      }
    },
    onSuccess: () => {
      form.reset();
      toast.success('Password berhasil diubah');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengubah password');
    },
  });

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="h-5 w-5" />
          <h5 className="text-base font-semibold">Ganti Password</h5>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              changePasswordMutation.mutate(values);
            })}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Lama</FormLabel>
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan password lama"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password Baru</FormLabel>
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimal 8 karakter"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Konfirmasi Password Baru</FormLabel>
                  <FormControl>
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Masukkan ulang password baru"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="showPassword-global"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="showPassword-global" className="text-sm text-gray-600 cursor-pointer">
                Tampilkan password
              </label>
            </div>

            <div className="flex gap-3 pt-2 justify-end">
              <Button variant="outline" type="button" onClick={() => form.reset()}>
                Batal
              </Button>
              <Button type="submit" disabled={changePasswordMutation.isPending}>
                <Save className="w-4 h-4" />
                Ganti Password
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function AkunTab() {
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => usersApi.getProfile(),
  });

  const form = useForm<z.infer<typeof akunFormSchema>>({
    resolver: zodResolver(akunFormSchema),
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        name: profile.name || '',
      });
    }
  }, [profile, form]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof akunFormSchema>) => {
      return usersApi.updateProfile({ name: data.name });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast.success('Profil berhasil diperbarui');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal memperbarui profil');
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <Skeleton className="h-20 w-20 rounded-full mx-auto" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const user = profile;

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <h5 className="text-base font-semibold mb-4">Informasi Akun</h5>

          <div className="flex flex-col items-center mb-6">
            <Avatar className="h-20 w-20 mb-4">
              <AvatarImage src={user?.image || undefined} alt={user?.name || ''} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <p className="text-sm text-gray-500">Akun pribadi Anda</p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => {
                updateProfileMutation.mutate(values);
              })}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama Anda" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Email
                  </label>
                  <div className="flex items-center gap-2 h-10 w-full rounded-md border border-input bg-gray-50 px-3 py-2 text-sm text-gray-500">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email || '—'}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2 justify-end">
                <Button variant="outline" type="button" onClick={() => form.reset()}>
                  Batal
                </Button>
                <Button type="submit" disabled={updateProfileMutation.isPending}>
                  <Save className="w-4 h-4" />
                  Simpan
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <ChangePasswordForm />
    </div>
  );
}

function SistemTab() {
  const [formData, setFormData] = useState<SettingsFormData>(initialFormData);
  const [logoFileName, setLogoFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (field: keyof SettingsFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logoFile: file }));
      setLogoFileName(file.name);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleReset = () => {
    setFormData(initialFormData);
    setLogoFileName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    console.log('Saving settings:', formData);
  };

  return (
    <Card className="py-5">
      <CardContent className="space-y-6">
        <h2 className="text-base font-semibold text-gray-900">Informasi Sistem</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="app-name">
              Nama Aplikasi <span className="text-red-500">*</span>
            </Label>
            <Input
              id="app-name"
              value={formData.appName}
              onChange={(e) => handleInputChange('appName', e.target.value)}
              placeholder="Nama aplikasi"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="default-language">
              Bahasa Default <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.defaultLanguage}
              onValueChange={(value) => handleInputChange('defaultLanguage', value)}
            >
              <SelectTrigger id="default-language" className="w-full">
                <SelectValue placeholder="Pilih bahasa" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="logo-system">
              Logo Sistem <span className="text-red-500">*</span>
            </Label>
            <div className="flex items-center gap-3">
              <input
                ref={fileInputRef}
                type="file"
                id="logo-system"
                accept=".png,.jpg,.jpeg"
                onChange={handleFileChange}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleBrowseClick}
                className="shrink-0"
              >
                Telusuri File
              </Button>
              <span className="text-xs text-gray-400 truncate">
                {logoFileName || 'Max 10MB, PNG, JPEG'}
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="timezone">
              Zona Waktu <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.timezone}
              onValueChange={(value) => handleInputChange('timezone', value)}
            >
              <SelectTrigger id="timezone" className="w-full">
                <SelectValue placeholder="Pilih zona waktu" />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="default-currency">
              Mata Uang Default <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.defaultCurrency}
              onValueChange={(value) => handleInputChange('defaultCurrency', value)}
            >
              <SelectTrigger id="default-currency" className="w-full">
                <SelectValue placeholder="Pilih mata uang" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((currency) => (
                  <SelectItem key={currency.value} value={currency.value}>
                    {currency.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="date-format">
              Format Tanggal <span className="text-red-500">*</span>
            </Label>
            <Select
              value={formData.dateFormat}
              onValueChange={(value) => handleInputChange('dateFormat', value)}
            >
              <SelectTrigger id="date-format" className="w-full">
                <SelectValue placeholder="Pilih format tanggal" />
              </SelectTrigger>
              <SelectContent>
                {dateFormats.map((format) => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" onClick={handleReset} className="px-6">
            Reset
          </Button>
          <Button type="button" onClick={handleSave} className="gap-2 px-6">
            <Save className="h-4 w-4" />
            Simpan Pengaturan
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Pengaturan</h1>
        <p className="text-sm text-gray-500 mt-1">Kelola pengaturan aplikasi dan akun</p>
      </div>

      <Tabs defaultValue="sistem" className="w-full">
        <TabsList variant="line">
          <TabsTrigger value="sistem">Sistem</TabsTrigger>
          <TabsTrigger value="akun">Akun</TabsTrigger>
        </TabsList>

        <TabsContent value="sistem">
          <SistemTab />
        </TabsContent>

        <TabsContent value="akun">
          <AkunTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
