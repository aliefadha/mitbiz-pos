import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { tenantsApi } from '@/lib/api/tenants';
import { useSession } from '@/lib/auth-client';
import { generateSlug } from '@/lib/utils';

const formSchema = z.object({
  nama: z.string().min(1, 'Nama tenant wajib diisi'),
  slug: z.string(),
  noHp: z
    .string()
    .regex(/^(\+62|62|0)?[0-9]{9,14}$/, 'Masukkan nomor HP yang valid')
    .optional()
    .or(z.literal('')),
  alamat: z.string().optional(),
});

export function CreateTenantPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      slug: '',
      noHp: '',
      alamat: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) =>
      tenantsApi.create({ ...data, userId: userId! }, userId),
    onSuccess: (tenant) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      navigate({ to: `/tenants/${tenant.slug}` });
    },
    onError: (error: Error) => {
      alert(error.message || 'Gagal membuat tenant');
    },
  });

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/tenants' })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h4 className="text-lg font-semibold m-0">Tambah Tenant Baru</h4>
          <p className="text-sm text-gray-500 m-0">Isi data tenant untuk mendaftarkan usaha baru</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Data Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => createMutation.mutate(values))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Tenant</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Masukkan nama tenant"
                        {...field}
                        onChange={(e) => {
                          field.onChange(e);
                          const slug = generateSlug(e.target.value);
                          form.setValue('slug', slug);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <input type="hidden" {...form.register('slug')} />
              <FormField
                control={form.control}
                name="noHp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>No. HP</FormLabel>
                    <FormControl>
                      <Input placeholder="contoh: 081234567890" {...field} />
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
                      <Textarea placeholder="Masukkan alamat tenant" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan
                </Button>
                <Button variant="outline" onClick={() => navigate({ to: '/tenants' })}>
                  Batal
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
