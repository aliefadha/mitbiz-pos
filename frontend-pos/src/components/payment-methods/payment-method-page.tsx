import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
  type CreatePaymentMethodDto,
  type PaymentMethod,
  paymentMethodsApi,
  type UpdatePaymentMethodDto,
} from '@/lib/api/payment-methods';
import { useSession } from '@/lib/auth-client';

const formSchema = z.object({
  nama: z.string().min(1, 'Nama metode pembayaran wajib diisi'),
  isActive: z.boolean().optional(),
});

export function PaymentMethodPage() {
  const queryClient = useQueryClient();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      isActive: true,
    },
  });
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data, isLoading } = useQuery({
    queryKey: ['payment-methods', tenantId],
    queryFn: () => paymentMethodsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePaymentMethodDto) => paymentMethodsApi.create(data),
    onSuccess: () => {
      setCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to create payment method');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentMethodDto }) =>
      paymentMethodsApi.update(id, data),
    onSuccess: () => {
      setCreateModalOpen(false);
      setEditingPaymentMethod(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to update payment method');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: paymentMethodsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to delete payment method');
    },
  });

  const handleCreate = () => {
    setEditingPaymentMethod(null);
    form.reset({
      nama: '',
      isActive: true,
    });
    setCreateModalOpen(true);
  };

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    form.reset({
      nama: paymentMethod.nama,
      isActive: paymentMethod.isActive,
    });
    setCreateModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (
      confirm(
        'Apakah Anda yakin ingin menghapus metode pembayaran ini? Tindakan ini tidak dapat dibatalkan.'
      )
    ) {
      deleteMutation.mutate(id);
    }
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (editingPaymentMethod) {
      updateMutation.mutate({
        id: editingPaymentMethod.id,
        data: values,
      });
    } else {
      createMutation.mutate({
        ...values,
        tenantId: tenantId!,
      } as CreatePaymentMethodDto);
    }
  });

  const filteredPaymentMethods =
    data?.data?.filter((method) => method.nama.toLowerCase().includes(searchQuery.toLowerCase())) ??
    [];

  const totalPaymentMethods = filteredPaymentMethods.length;
  const totalPages = Math.ceil(totalPaymentMethods / pageSize);
  const displayedPaymentMethods = filteredPaymentMethods.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
  };

  return (
    <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-semibold m-0">Manajemen Metode Pembayaran </h4>
            <p className="text-sm text-gray-500 m-0">Kelola metode pembayaran yang tersedia </p>
          </div>
          <div className="flex gap-2">
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Metode Pembayaran
              </Button>
            </DialogTrigger>
          </div>
        </div>

        <Card>
          <CardContent>
            <h4 className="text-base font-semibold mb-6">Daftar Metode Pembayaran</h4>
            <div className="mb-6 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari metode pembayaran..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-full"
                />
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
                <TableHeader className="[&_tr]:border-b-0">
                  <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                    <TableHead className="text-gray-800 font-medium w-[80px] rounded-tl-lg rounded-bl-lg">
                      No
                    </TableHead>
                    <TableHead className="text-gray-800 font-medium">Nama</TableHead>
                    <TableHead className="text-gray-800 font-medium">Status</TableHead>
                    <TableHead className="text-gray-800 font-medium w-[120px] rounded-tr-lg rounded-br-lg">
                      Aksi
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedPaymentMethods.map((paymentMethod, index) => (
                    <TableRow key={paymentMethod.id} className="hover:bg-white">
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{paymentMethod.nama}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${getStatusColor(!!paymentMethod.isActive)}`}
                        >
                          {paymentMethod.isActive ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(paymentMethod)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(paymentMethod.id)}
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

            {totalPages > 0 && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                    {Math.min(currentPage * pageSize, totalPaymentMethods)} dari{' '}
                    {totalPaymentMethods} metode pembayaran
                  </span>
                  <Select
                    value={pageSize.toString()}
                    onValueChange={(value) => {
                      setPageSize(parseInt(value));
                      setCurrentPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[70px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {(() => {
                      const pages: (number | string)[] = [];

                      if (totalPages <= 5) {
                        for (let i = 1; i <= totalPages; i++) {
                          pages.push(i);
                        }
                      } else {
                        pages.push(1);

                        if (currentPage <= 3) {
                          pages.push(2, 3, '...');
                        } else if (currentPage >= totalPages - 2) {
                          pages.push('...', totalPages - 2, totalPages - 1);
                        } else {
                          pages.push('...', currentPage, '...');
                        }

                        pages.push(totalPages);
                      }

                      return pages.map((page, index) =>
                        page === '...' ? (
                          <span key={`ellipsis-${index}`} className="px-2 text-sm text-gray-500">
                            ...
                          </span>
                        ) : (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page as number)}
                            className="w-9"
                          >
                            {page}
                          </Button>
                        )
                      );
                    })()}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPaymentMethod ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="nama"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Metode Pembayaran</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan nama metode pembayaran" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {editingPaymentMethod && (
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Status Aktif</FormLabel>
                      </div>
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
                  {editingPaymentMethod ? 'Simpan' : 'Buat'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </div>
    </Dialog>
  );
}
