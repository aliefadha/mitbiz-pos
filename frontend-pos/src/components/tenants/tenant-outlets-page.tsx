import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft, Package, Plus, Trash2 } from 'lucide-react';
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
import { type Outlet, outletsApi } from '@/lib/api/outlets';
import { tenantsApi } from '@/lib/api/tenants';

const formSchema = z.object({
  nama: z.string().min(1, 'Nama outlet wajib diisi'),
  kode: z.string().min(1, 'Kode outlet wajib diisi'),
  alamat: z.string().optional(),
  noHp: z.string().optional(),
});

export function TenantOutletsPage() {
  const { slug } = useParams({ from: '/_protected/tenants/$slug/outlets/' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchText, setSearchText] = useState('');
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      kode: '',
      alamat: '',
      noHp: '',
    },
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', slug],
    queryFn: () => tenantsApi.getBySlug(slug),
  });

  const { data: outlets, isLoading } = useQuery({
    queryKey: ['outlets', tenant?.id],
    queryFn: () => outletsApi.getAll({ tenantId: tenant!.id }),
    enabled: !!tenant?.id,
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      tenantId: string;
      nama: string;
      kode: string;
      alamat?: string;
      noHp?: string;
    }) => outletsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets', tenant?.id] });
      setIsModalOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => outletsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outlets', tenant?.id] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const handleCreate = () => {
    form.reset();
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this outlet? This action cannot be undone.')) {
      deleteMutation.mutate(id);
    }
  };

  const filteredOutlets = outlets?.data?.filter(
    (outlet: Outlet) =>
      outlet.nama.toLowerCase().includes(searchText.toLowerCase()) ||
      outlet.kode.toLowerCase().includes(searchText.toLowerCase()) ||
      outlet.alamat?.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <Button
        variant="link"
        onClick={() => navigate({ to: `/tenants/${slug}` })}
        className="mb-4 pl-0"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {tenant?.nama || 'Tenant'}
      </Button>

      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-semibold m-0">Outlets</h4>
          <p className="text-sm text-gray-500 m-0">Manage outlets for {tenant?.nama}</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Add Outlet
        </Button>
      </div>

      <div className="mb-4">
        <Input
          placeholder="Search outlets..."
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          className="max-w-[300px]"
        />
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
              <TableHead className="w-[60px]">No.</TableHead>
              <TableHead className="w-[100px]">Kode</TableHead>
              <TableHead>Nama</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[140px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOutlets?.map((outlet, index) => (
              <TableRow
                key={outlet.id}
                className="cursor-pointer"
                onClick={() => navigate({ to: `/tenants/${slug}/outlets/${outlet.id}` })}
              >
                <TableCell>{index + 1}</TableCell>
                <TableCell>
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm">{outlet.kode}</code>
                </TableCell>
                <TableCell className="font-medium">{outlet.nama}</TableCell>
                <TableCell>{outlet.alamat || '-'}</TableCell>
                <TableCell>{outlet.noHp || '-'}</TableCell>
                <TableCell>
                  <span className={outlet.isActive ? 'text-green-600' : 'text-red-500'}>
                    {outlet.isActive ? 'Active' : 'Inactive'}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate({ to: `/tenants/${slug}/outlets/${outlet.id}` });
                      }}
                    >
                      <Package className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(outlet.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Outlet</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit((v) => createMutation.mutate({ ...v, tenantId: tenant!.id }))();
              }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="kode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kode Outlet</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: OUT-001" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Outlet</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: Outlet Jakarta" {...field} />
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
                      <Textarea placeholder="Masukkan alamat outlet" {...field} />
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
                    <FormLabel>No. HP</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: 081234567890" {...field} />
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
  );
}
