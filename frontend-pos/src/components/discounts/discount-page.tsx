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
import {
  type CreateDiscountDto,
  type Discount,
  discountsApi,
  type UpdateDiscountDto,
} from '@/lib/api/discounts';
import { outletsApi } from '@/lib/api/outlets';
import { useSession } from '@/lib/auth-client';

const formSchema = z.object({
  nama: z.string().min(1, 'Nama diskon wajib diisi'),
  rate: z.string().min(1, 'Tarif diskon wajib diisi'),
  scope: z.enum(['product', 'transaction']),
  level: z.enum(['tenant', 'outlet']),
  outletId: z.string().optional(),
  isActive: z.boolean().optional(),
});

export function DiscountPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      rate: '',
      scope: 'transaction',
      level: 'tenant',
      isActive: true,
    },
  });

  const levelValue = form.watch('level');

  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const { data, isLoading } = useQuery({
    queryKey: ['discounts', tenantId],
    queryFn: () => discountsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const outlets = outletsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreateDiscountDto) => discountsApi.create(data),
    onSuccess: () => {
      setCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to create discount');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDiscountDto }) =>
      discountsApi.update(id, data),
    onSuccess: () => {
      setCreateModalOpen(false);
      setEditingDiscount(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to update discount');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: discountsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to delete discount');
    },
  });

  const handleCreate = () => {
    setEditingDiscount(null);
    form.reset({
      nama: '',
      rate: '',
      scope: 'transaction',
      level: 'tenant',
      outletId: undefined,
      isActive: true,
    });
    setCreateModalOpen(true);
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    form.reset({
      nama: discount.nama,
      rate: discount.rate,
      scope: discount.scope,
      level: discount.level,
      outletId: discount.outletId || undefined,
      isActive: discount.isActive,
    });
    setCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (
      confirm('Apakah Anda yakin ingin menghapus diskon ini? Tindakan ini tidak dapat dibatalkan.')
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = form.handleSubmit((values) => {
    const data = {
      nama: values.nama,
      rate: values.rate,
      scope: values.scope,
      level: values.level,
      outletId: values.level === 'outlet' ? values.outletId : null,
      isActive: values.isActive,
    };

    if (editingDiscount) {
      updateMutation.mutate({
        id: editingDiscount.id,
        data,
      });
    } else {
      createMutation.mutate({
        ...data,
        tenantId: tenantId!,
      } as CreateDiscountDto);
    }
  });

  const displayedDiscounts = data?.data ?? [];

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-semibold m-0">Diskon</h4>
            <p className="text-sm text-gray-500 m-0">Kelola semua diskon dalam sistem</p>
          </div>
          <div className="flex gap-2">
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Diskon
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
                <TableHead>Scope</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Outlet</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[120px]">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedDiscounts.map((discount, index) => (
                <TableRow key={discount.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{discount.nama}</TableCell>
                  <TableCell>{discount.rate}%</TableCell>
                  <TableCell>
                    {discount.scope === 'product' ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-purple-100 text-purple-700">
                        Produk
                      </span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-700">
                        Transaksi
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {discount.level === 'tenant' ? (
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
                    {discount.level === 'tenant'
                      ? '-'
                      : outlets.find((o) => o.id === discount.outletId)?.nama || '-'}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${getStatusColor(!!discount.isActive)}`}
                    >
                      {discount.isActive ? 'Aktif' : 'Tidak Aktif'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(discount)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(discount.id)}>
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
            <DialogTitle>{editingDiscount ? 'Edit Diskon' : 'Tambah Diskon'}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Diskon</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama diskon" {...field} />
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
                        placeholder="Masukkan tarif diskon"
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
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scope Diskon</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih scope diskon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="transaction">Transaksi</SelectItem>
                        <SelectItem value="product">Produk</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="level"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Level Diskon</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih level diskon" />
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
              {levelValue === 'outlet' && (
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
              {editingDiscount && (
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
                  disabled={createMutation.isPending || updateMutation.isPending || !tenantId}
                >
                  {editingDiscount ? 'Simpan' : 'Buat'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </div>
    </Dialog>
  );
}
