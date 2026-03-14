import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { AppWindow, ArrowLeft, Edit, ShoppingBag, ShoppingCart, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { categoriesApi } from '@/lib/api/categories';
import { outletsApi } from '@/lib/api/outlets';
import { productsApi } from '@/lib/api/products';
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

export function TenantDetailPage() {
  const { slug } = useParams({ from: '/_protected/(tenant)/tenants/$slug/' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      slug: '',
      noHp: '',
      alamat: '',
    },
  });

  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => tenantsApi.getBySlug(slug),
  });

  const updateMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => tenantsApi.update(slug, data, userId),
    onSuccess: () => {
      setEditModalOpen(false);
      queryClient.invalidateQueries({ queryKey: ['tenant', slug] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to update tenant');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tenantsApi.delete(slug, userId),
    onSuccess: () => {
      setDeleteModalOpen(false);
      navigate({ to: '/tenants' });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to delete tenant');
    },
  });

  const { data: categoriesData, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories', tenant?.id],
    queryFn: () => categoriesApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', tenant?.id],
    queryFn: () => productsApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const { data: outletsData, isLoading: outletsLoading } = useQuery({
    queryKey: ['outlets', tenant?.id],
    queryFn: () => outletsApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['tenant-users', slug],
    queryFn: () => tenantsApi.getUsers(slug),
    enabled: !!slug,
  });

  const isLoading =
    tenantLoading || categoriesLoading || productsLoading || outletsLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (!tenant) {
    return <div>Tenant not found</div>;
  }

  const categories = categoriesData?.data || [];
  const products = productsData?.data || [];
  const outlets = outletsData?.data || [];
  const users = usersData?.data || [];

  return (
    <div>
      <Button variant="link" onClick={() => navigate({ to: '/tenants' })} className="mb-4 pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Tenants
      </Button>

      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tenant Details</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                form.reset({
                  nama: tenant.nama,
                  slug: tenant.slug,
                  noHp: tenant.noHp,
                  alamat: tenant.alamat,
                });
                setEditModalOpen(true);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button variant="destructive" onClick={() => setDeleteModalOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Nama</dt>
              <dd>{tenant.nama}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">No. HP</dt>
              <dd>{tenant.noHp || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Alamat</dt>
              <dd>{tenant.alamat || '-'}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Dibuat</dt>
              <dd>{new Date(tenant.createdAt).toLocaleString('id-ID')}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => navigate({ to: '/tenants/$slug/outlets', params: { slug } })}
        >
          <CardContent>
            <div className="flex items-center gap-2 ">
              <ShoppingBag className="h-5 w-5" />
              <span className="text-sm font-medium">Outlets</span>
            </div>
            <p className="text-2xl font-bold mt-2">{outlets.length}</p>
            <Button variant="link" className="p-0 h-auto mt-1">
              Outlet →
            </Button>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => navigate({ to: '/tenants/$slug/categories', params: { slug } })}
        >
          <CardContent>
            <div className="flex items-center gap-2 ">
              <AppWindow className="h-5 w-5" />
              <span className="text-sm font-medium">Categories</span>
            </div>
            <p className="text-2xl font-bold mt-2">{categories.length}</p>
            <Button variant="link" className="p-0 h-auto mt-1">
              Kategori →
            </Button>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => navigate({ to: '/tenants/$slug/products', params: { slug } })}
        >
          <CardContent>
            <div className="flex items-center gap-2 ">
              <ShoppingCart className="h-5 w-5" />
              <span className="text-sm font-medium">Products</span>
            </div>
            <p className="text-2xl font-bold mt-2">{products.length}</p>
            <Button variant="link" className="p-0 h-auto mt-1">
              Produk →
            </Button>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer hover:bg-gray-50"
          onClick={() => navigate({ to: '/tenants/$slug/users', params: { slug } })}
        >
          <CardContent>
            <div className="flex items-center gap-2 ">
              <Users className="h-5 w-5" />
              <span className="text-sm font-medium">Pengguna</span>
            </div>
            <p className="text-2xl font-bold mt-2">{users.length}</p>
            <Button variant="link" className="p-0 h-auto mt-1">
              Pengguna →
            </Button>
          </CardContent>
        </Card>
      </div>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit((values) => updateMutation.mutate(values))}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama</FormLabel>
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
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Tenant</DialogTitle>
          </DialogHeader>
          <p>Apakah Anda yakin ingin menghapus tenant ini? Tindakan ini tidak dapat dibatalkan.</p>
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
