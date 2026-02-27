import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Eye, Plus } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
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

export function TenantsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      slug: '',
      noHp: '',
      alamat: '',
    },
  });

  const { data: tenants, isLoading } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.getAll(),
  });

  const createMutation = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) =>
      tenantsApi.create({ ...data, userId: userId! }, userId),
    onSuccess: () => {
      setCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to create tenant');
    },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h4 className="text-lg font-semibold m-0">Tenant Management</h4>
          <p className="text-sm text-gray-500 m-0">Manage all tenants in the system</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Tenant</DialogTitle>
              </DialogHeader>
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
                    <Button type="submit" disabled={createMutation.isPending}>
                      Create
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">No</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-[180px]">Created At</TableHead>
              <TableHead className="w-[250px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants?.map((tenant, index) => (
              <TableRow key={tenant.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    size="sm"
                    className="p-0 h-auto font-normal"
                    onClick={() =>
                      navigate({ to: '/tenants/$slug', params: { slug: tenant.slug } })
                    }
                  >
                    {tenant.nama}
                  </Button>
                </TableCell>
                <TableCell>{new Date(tenant.createdAt).toLocaleDateString('id-ID')}</TableCell>
                <TableCell>
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => navigate({ to: `/tenants/${tenant.slug}` })}
                  >
                    <Eye className="mr-1 h-4 w-4" />
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
