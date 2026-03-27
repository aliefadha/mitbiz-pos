import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Building2, Save, Settings, Trash2, Upload } from 'lucide-react';
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
import { usePermissions } from '@/hooks/use-auth';
import { type TenantSettings, tenantsApi } from '@/lib/api/tenants';
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
        <p className="text-sm text-gray-500 m-0">Kelola pengaturan bisnis dan sistem</p>
      </div>

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
                    <Avatar className="h-24 w-24 mb-4 cursor-pointer" onClick={handleImageClick}>
                      {imagePreview ? <AvatarImage src={imagePreview} alt="Tenant logo" /> : null}
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
                            <Input placeholder="Enter address" {...field} disabled={!canUpdate} />
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
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/settings/')({
  component: SettingsPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('settings', 'read', 'tenant');
  },
});
