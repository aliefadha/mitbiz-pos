import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTenant } from '@/contexts/tenant-context';
import { outletsApi } from '@/lib/api/outlets';
import { type CreateTaxDto, type Tax, taxesApi, type UpdateTaxDto } from '@/lib/api/taxes';

const formSchema = z.object({
  nama: z.string().min(1, 'Nama pajak wajib diisi'),
  rate: z.string().min(1, 'Tarif pajak wajib diisi'),
  taxLevel: z.enum(['tenant', 'outlet']),
  outletId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export function TaxPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingTax, setEditingTax] = useState<Tax | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      rate: '',
      taxLevel: 'tenant',
      isActive: true,
    },
  });

  const taxLevelValue = form.watch('taxLevel');

  const { selectedTenant: contextSelectedTenant } = useTenant();

  const effectiveTenantId = contextSelectedTenant?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['taxes', effectiveTenantId],
    queryFn: () => taxesApi.getAll({ tenantId: effectiveTenantId }),
    enabled: !!effectiveTenantId,
  });

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', effectiveTenantId],
    queryFn: () => outletsApi.getAll({ tenantId: effectiveTenantId }),
    enabled: !!effectiveTenantId,
  });

  const outlets = outletsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreateTaxDto) => taxesApi.create(data),
    onSuccess: () => {
      setCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to create tax');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTaxDto }) => taxesApi.update(id, data),
    onSuccess: () => {
      setCreateModalOpen(false);
      setEditingTax(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to update tax');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: taxesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxes'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to delete tax');
    },
  });

  const handleCreate = () => {
    setEditingTax(null);
    form.reset({
      nama: '',
      rate: '',
      taxLevel: 'tenant',
      outletId: undefined,
      isActive: true,
    });
    setCreateModalOpen(true);
  };

  const handleEdit = (tax: Tax) => {
    setEditingTax(tax);
    form.reset({
      nama: tax.nama,
      rate: tax.rate,
      taxLevel: tax.isGlobal ? 'tenant' : 'outlet',
      outletId: tax.outletId || undefined,
      isActive: tax.isActive,
    });
    setCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (
      confirm('Apakah Anda yakin ingin menghapus pajak ini? Tindakan ini tidak dapat dibatalkan.')
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = form.handleSubmit((values) => {
    const data = {
      nama: values.nama,
      rate: values.rate,
      isGlobal: values.taxLevel === 'tenant',
      outletId: values.taxLevel === 'outlet' ? values.outletId : null,
      isActive: values.isActive,
    };

    if (editingTax) {
      updateMutation.mutate({
        id: editingTax.id,
        data,
      });
    } else {
      createMutation.mutate({
        ...data,
        tenantId: effectiveTenantId!,
      } as CreateTaxDto);
    }
  });

  const displayedTaxes = data?.data ?? [];

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-semibold m-0">Pajak</h4>
            <p className="text-sm text-gray-500 m-0">Kelola semua pajak dalam sistem</p>
          </div>
          <div className="flex gap-2">
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Pajak
              </Button>
            </DialogTrigger>
          </div>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Tarif (%)</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedTaxes.map((tax, index) => (
                <TableRow key={tax.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{tax.nama}</TableCell>
                  <TableCell>{tax.rate}%</TableCell>
                  <TableCell>
                    {tax.isGlobal ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700">
                        Tenant
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">
                        Outlet
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {tax.isGlobal ? '-' : outlets.find((o) => o.id === tax.outletId)?.nama || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(!!tax.isActive)}`}
                    >
                      {tax.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(tax)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(tax.id)}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTax ? 'Edit Pajak' : 'Tambah Pajak'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pajak</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama pajak" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="rate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tarif (%)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Masukkan tarif pajak"
                        type="number"
                        step="0.01"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="taxLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level Pajak</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih level pajak" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="tenant">Tenant</SelectItem>
                        <SelectItem value="outlet">Outlet</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {taxLevelValue === 'outlet' && (
                <FormField
                  control={form.control}
                  name="outletId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Outlet</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih outlet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {outlets.map((outlet) => (
                            <SelectItem key={outlet.id} value={outlet.id}>
                              {outlet.nama}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {editingTax && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <FormLabel className="text-base">Status Aktif</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending || !effectiveTenantId
                  }
                >
                  {editingTax ? 'Simpan' : 'Buat'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </div>
    </Dialog>
  );
}
