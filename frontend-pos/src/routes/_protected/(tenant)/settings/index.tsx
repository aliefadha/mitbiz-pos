import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Building2, Lock, Mail, Save, Settings, Trash2, Upload, User } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/use-auth';
import { type TenantSettings, tenantsApi } from '@/lib/api/tenants';
import { usersApi } from '@/lib/api/users';
import { authClient } from '@/lib/auth-client';
import { checkPermissionWithScope } from '@/lib/permissions';
import { useSessionWithCache } from '@/lib/session-cache';

const settingsFormSchema = z.object({
  nama: z.string().min(1, 'Business name is required'),
  slug: z.string().min(1, 'Slug is required'),
  alamat: z.string().optional(),
  noHp: z.string().optional(),
  taxRate: z.number().min(0).max(100),
  receiptFooter: z.string().optional(),
});

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
                id="showPassword"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="showPassword" className="text-sm text-gray-600 cursor-pointer">
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
  const { data: session } = useSessionWithCache();
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

  const user = profile || session?.user;

  return (
    <div className="space-y-6 pt-2">
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

function SettingsPage() {
  const { data: session } = useSessionWithCache();
  const tenantId = session?.user?.tenantId;
  const queryClient = useQueryClient();

  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission('tenants', 'update');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMarkedForDeletion, setImageMarkedForDeletion] = useState(false);

  const form = useForm<z.infer<typeof settingsFormSchema>>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      nama: '',
      slug: '',
      alamat: '',
      noHp: '',
      taxRate: 0,
      receiptFooter: '',
    },
  });

  const { data: tenant, isLoading: isTenantLoading } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => tenantsApi.getById(tenantId!),
    enabled: !!tenantId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof settingsFormSchema>) => {
      if (selectedImage) {
        const formData = new FormData();
        formData.append('nama', data.nama);
        formData.append('slug', data.slug);
        formData.append('alamat', data.alamat || '');
        formData.append('noHp', data.noHp || '');
        formData.append('taxRate', String(data.taxRate));
        formData.append('receiptFooter', data.receiptFooter || '');
        formData.append('image', selectedImage);
        if (imageMarkedForDeletion) {
          formData.append('deleteImage', 'true');
        }
        return tenantsApi.updateWithImage(tenant!.id, formData);
      }
      if (imageMarkedForDeletion) {
        const formData = new FormData();
        formData.append('nama', data.nama);
        formData.append('slug', data.slug);
        formData.append('alamat', data.alamat || '');
        formData.append('noHp', data.noHp || '');
        formData.append('taxRate', String(data.taxRate));
        formData.append('receiptFooter', data.receiptFooter || '');
        formData.append('deleteImage', 'true');
        return tenantsApi.updateWithImage(tenant!.id, formData);
      }
      return tenantsApi.update(tenant!.id, {
        nama: data.nama,
        slug: data.slug,
        alamat: data.alamat,
        noHp: data.noHp,
        settings: {
          taxRate: data.taxRate,
          receiptFooter: data.receiptFooter,
          currency: tenant?.settings?.currency || 'IDR',
          timezone: tenant?.settings?.timezone || 'Asia/Jakarta',
        } as TenantSettings,
      });
    },
    onSuccess: () => {
      setSelectedImage(null);
      setImagePreview(null);
      setImageMarkedForDeletion(false);
      queryClient.invalidateQueries({ queryKey: ['tenant', tenantId] });
      toast.success('Pengaturan berhasil diperbarui');
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to update settings');
    },
  });

  useEffect(() => {
    if (tenant) {
      form.reset({
        nama: tenant.nama,
        slug: tenant.slug,
        alamat: tenant.alamat || '',
        noHp: tenant.noHp || '',
        taxRate: tenant.settings?.taxRate || 0,
        receiptFooter: tenant.settings?.receiptFooter || '',
      });
      if (tenant.image && !imagePreview) {
        const imageUrl = tenant.image.startsWith('http')
          ? tenant.image
          : `${import.meta.env.VITE_API_URL}/${tenant.image.replace(/^\.\//, '')}`;
        setImagePreview(imageUrl);
      }
    }
  }, [tenant, form, imagePreview]);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="w-full">
      <div className="mb-6">
        <h4 className="text-lg font-semibold m-0">Pengaturan Aplikasi</h4>
        <p className="text-sm text-gray-500 m-0">Kelola pengaturan bisnis dan akun</p>
      </div>

      <Tabs defaultValue="bisnis" className="w-full">
        <TabsList variant="line">
          <TabsTrigger value="bisnis">Bisnis</TabsTrigger>
          <TabsTrigger value="akun">Akun</TabsTrigger>
        </TabsList>

        <TabsContent value="bisnis">
          {isTenantLoading ? (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <Skeleton className="h-24 w-24 rounded-full mx-auto" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          ) : (
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit((values) => {
                  updateSettingsMutation.mutate(values);
                })}
                className="space-y-6"
              >
                {tenant && (
                  <Card>
                    <CardContent>
                      <h5 className="text-base font-semibold mb-4">Informasi Bisnis</h5>

                      <div className="flex flex-col items-center mb-6">
                        <Avatar
                          className="h-24 w-24 mb-4 cursor-pointer"
                          onClick={handleImageClick}
                        >
                          {imagePreview ? (
                            <AvatarImage src={imagePreview} alt="Tenant logo" />
                          ) : null}
                          <AvatarFallback>
                            <Building2 className="h-10 w-10" />
                          </AvatarFallback>
                        </Avatar>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            disabled={!canUpdate}
                            onClick={handleImageClick}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Ganti Logo
                          </Button>
                          {tenant.image && !selectedImage && !imageMarkedForDeletion && (
                            <Button
                              variant="destructive"
                              size="sm"
                              type="button"
                              disabled={!canUpdate}
                              onClick={() => {
                                setImageMarkedForDeletion(true);
                                setImagePreview(null);
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Hapus
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="nama"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nama Bisnis</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter business name"
                                  {...field}
                                  disabled={!canUpdate}
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
                              <FormLabel>Kode</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  disabled={!canUpdate}
                                  onChange={(e) => field.onChange(e.target.value)}
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
                              <FormLabel>Alamat</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter address"
                                  {...field}
                                  disabled={!canUpdate}
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
                              <FormLabel>Telepon</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter phone number"
                                  {...field}
                                  disabled={!canUpdate}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {tenant?.settings && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Settings className="h-5 w-5" />
                        <h5 className="text-base font-semibold">Pengaturan Sistem</h5>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="taxRate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pajak (%)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="Enter tax rate"
                                  {...field}
                                  disabled={!canUpdate}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="receiptFooter"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Footer struk</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter receipt footer text"
                                  {...field}
                                  disabled={!canUpdate}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {canUpdate && (
                  <div className="flex gap-3 pt-2 justify-end">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() => {
                        setImageMarkedForDeletion(false);
                        setSelectedImage(null);
                        if (tenant?.image) {
                          const imageUrl = tenant.image.startsWith('http')
                            ? tenant.image
                            : `${import.meta.env.VITE_API_URL}/${tenant.image.replace(/^\.\//, '')}`;
                          setImagePreview(imageUrl);
                        } else {
                          setImagePreview(null);
                        }
                        form.reset();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={updateSettingsMutation.isPending}>
                      <Save className="w-4 h-4" />
                      Simpan Pengaturan
                    </Button>
                  </div>
                )}
              </form>
            </Form>
          )}
        </TabsContent>

        <TabsContent value="akun">
          <AkunTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/settings/')({
  component: SettingsPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('settings', 'read', 'tenant');
  },
});
