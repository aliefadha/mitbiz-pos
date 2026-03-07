import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Building2, Save, Settings, Upload } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { type TenantSettings, tenantsApi } from '@/lib/api/tenants';
import { useSession } from '@/lib/auth-client';

const settingsFormSchema = z.object({
  nama: z.string().min(1, 'Business name is required'),
  slug: z.string().min(1, 'Slug is required'),
  alamat: z.string().optional(),
  noHp: z.string().optional(),
  taxRate: z.number().min(0).max(100),
  receiptFooter: z.string().optional(),
});

export function SettingsPage() {
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

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

  const {
    data: tenant,
    isLoading: isTenantLoading,
    refetch: refetchTenant,
  } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => tenantsApi.getById(tenantId!),
    enabled: !!tenantId,
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof settingsFormSchema>) => {
      // Update tenant info
      await tenantsApi.update(tenant!.slug, {
        nama: data.nama,
        alamat: data.alamat,
        noHp: data.noHp,
      });

      // Update settings
      await tenantsApi.update(tenant!.slug, {
        settings: {
          taxRate: data.taxRate,
          receiptFooter: data.receiptFooter,
          currency: tenant?.settings?.currency || 'IDR',
          timezone: tenant?.settings?.timezone || 'Asia/Jakarta',
        } as TenantSettings,
      });
    },
    onSuccess: () => {
      refetchTenant();
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
    }
  }, [tenant, form]);

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
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarFallback>
                        <Building2 className="h-10 w-10" />
                      </AvatarFallback>
                    </Avatar>
                    <Button variant="outline" size="sm" type="button">
                      <Upload className="mr-2 h-4 w-4" />
                      Ganti Logo
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nama"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nama Bisnis</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter business name" {...field} />
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
                            <Input disabled {...field} />
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
                            <Input placeholder="Enter address" {...field} />
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
                            <Input placeholder="Enter phone number" {...field} />
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
                            <Input placeholder="Enter receipt footer text" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex gap-3 pt-2 justify-end">
              <Button variant="outline" type="button" onClick={() => form.reset()}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateSettingsMutation.isPending}>
                <Save className="w-4 h-4" />
                Simpan Pengaturan
              </Button>
            </div>
          </form>
        </Form>
      )}
    </div>
  );
}
