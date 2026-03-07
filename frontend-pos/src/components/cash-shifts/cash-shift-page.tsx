import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Eye, Plus, Search, X } from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  type CashShift,
  type CreateCashShiftDto,
  cashShiftsApi,
  type UpdateCashShiftDto,
} from '@/lib/api/cash-shifts';
import { outletsApi } from '@/lib/api/outlets';
import { useSession } from '@/lib/auth-client';

const formSchema = z.object({
  outletId: z.string().min(1, 'Outlet wajib dipilih'),
  jumlahBuka: z.string().optional(),
  status: z.enum(['buka', 'tutup']).optional(),
  catatan: z.string().optional(),
});

const closeShiftSchema = z.object({
  jumlahTutup: z.string().min(1, 'Jumlah tutup wajib diisi'),
  catatan: z.string().optional(),
});

export function CashShiftPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [closeModalOpen, setCloseModalOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<CashShift | null>(null);

  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;
  const userId = session?.user?.id;

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  // Check for user's open cash shift
  const { data: userOpenShiftData, isLoading: userOpenShiftLoading } = useQuery({
    queryKey: ['cash-shifts', 'user-open', tenantId, userId],
    queryFn: async () => {
      const response = await cashShiftsApi.getAll({
        tenantId,
        status: 'buka',
      });
      return response.data.find((shift) => shift.cashierId === userId) || null;
    },
    enabled: !!tenantId && !!userId,
  });

  const createForm = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      outletId: '',
      jumlahBuka: '0',
      status: 'buka',
      catatan: '',
    },
  });

  const closeForm = useForm<z.infer<typeof closeShiftSchema>>({
    resolver: zodResolver(closeShiftSchema),
    defaultValues: {
      jumlahTutup: '',
      catatan: '',
    },
  });

  const { data: cashShiftsData, isLoading: cashShiftsLoading } = useQuery({
    queryKey: ['cash-shifts', tenantId, searchQuery, statusFilter],
    queryFn: () =>
      cashShiftsApi.getAll({
        tenantId,
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? (statusFilter as 'buka' | 'tutup') : undefined,
      }),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateCashShiftDto) => cashShiftsApi.create(data),
    onSuccess: () => {
      setCreateModalOpen(false);
      createForm.reset();
      queryClient.invalidateQueries({ queryKey: ['cash-shifts'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Gagal membuka shift');
    },
  });

  const closeMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCashShiftDto }) =>
      cashShiftsApi.update(id, data),
    onSuccess: () => {
      setCloseModalOpen(false);
      setSelectedShift(null);
      closeForm.reset();
      queryClient.invalidateQueries({ queryKey: ['cash-shifts'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Gagal menutup shift');
    },
  });

  const handleCreate = createForm.handleSubmit((values) => {
    if (!tenantId || !values.outletId) {
      alert('Silakan pilih tenant dan outlet terlebih dahulu');
      return;
    }
    createMutation.mutate({
      tenantId: tenantId,
      outletId: values.outletId,
      jumlahBuka: values.jumlahBuka || '0',
      status: 'buka',
      catatan: values.catatan || null,
    });
  });

  const handleClose = closeForm.handleSubmit((values) => {
    if (!selectedShift) return;
    closeMutation.mutate({
      id: selectedShift.id,
      data: {
        jumlahTutup: values.jumlahTutup,
        status: 'tutup',
        catatan: values.catatan || null,
      },
    });
  });

  const displayedShifts = cashShiftsData?.data ?? [];

  const formatRupiah = (value: string | number): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'buka':
        return 'bg-green-100 text-green-700';
      case 'tutup':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'buka':
        return 'Buka';
      case 'tutup':
        return 'Tutup';
      default:
        return status;
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-semibold m-0">Shift Kasir</h4>
          <p className="text-sm text-gray-500 m-0">Kelola shift kasir</p>
        </div>
        {!userOpenShiftLoading &&
          (userOpenShiftData ? (
            <Button
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => {
                setSelectedShift(userOpenShiftData);
                closeForm.reset({ jumlahTutup: '', catatan: '' });
                setCloseModalOpen(true);
              }}
            >
              <X className="h-4 w-4 mr-2" />
              Tutup Shift
            </Button>
          ) : (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Buka Shift
            </Button>
          ))}
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari shift..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="buka">Buka</SelectItem>
            <SelectItem value="tutup">Tutup</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {cashShiftsLoading ? (
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
              <TableHead className="text-gray-800 font-medium">Outlet</TableHead>
              <TableHead className="text-gray-800 font-medium">Kasir</TableHead>
              <TableHead className="text-gray-800 font-medium">Jumlah Buka</TableHead>
              <TableHead className="text-gray-800 font-medium">Jumlah Tutup</TableHead>
              <TableHead className="text-gray-800 font-medium">Status</TableHead>
              <TableHead className="text-gray-800 font-medium">Tanggal</TableHead>
              <TableHead className="text-gray-800 font-medium w-[80px] rounded-tr-lg rounded-br-lg">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayedShifts.map((shift: CashShift, index: number) => (
              <TableRow key={shift.id} className="hover:bg-white">
                <TableCell>{index + 1}</TableCell>
                <TableCell>{shift.outlet?.nama || '-'}</TableCell>
                <TableCell>{shift.cashier?.name || '-'}</TableCell>
                <TableCell className="font-medium">{formatRupiah(shift.jumlahBuka)}</TableCell>
                <TableCell className="font-medium">
                  {shift.status === 'tutup' ? formatRupiah(shift.jumlahTutup) : '-'}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(
                      shift.status
                    )}`}
                  >
                    {getStatusLabel(shift.status)}
                  </span>
                </TableCell>
                <TableCell>{formatDate(shift.openedAt)}</TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      navigate({
                        to: '/cash-shifts/$cashShiftId',
                        params: { cashShiftId: shift.id },
                      })
                    }
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {!cashShiftsLoading && cashShiftsData?.meta && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Menampilkan {displayedShifts.length} dari {cashShiftsData.meta.total} shift
          </p>
        </div>
      )}

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Buka Shift Kasir</DialogTitle>
          </DialogHeader>
          <Form {...createForm}>
            <form onSubmit={handleCreate} className="space-y-4">
              <FormField
                control={createForm.control}
                name="outletId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Outlet</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih outlet" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {outletsData?.data?.map((outlet) => (
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
              <FormField
                control={createForm.control}
                name="jumlahBuka"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jumlah Buka (Kas di awal)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="catatan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan (Opsional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan catatan" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || !tenantId || !createForm.watch('outletId')}
                >
                  {createMutation.isPending ? 'Membuka...' : 'Buka Shift'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={closeModalOpen} onOpenChange={setCloseModalOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Tutup Shift Kasir</DialogTitle>
          </DialogHeader>
          {selectedShift && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Jumlah Buka:</span>
                  <span className="font-medium">{formatRupiah(selectedShift.jumlahBuka)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expected:</span>
                  <span className="font-medium">{formatRupiah(selectedShift.jumlahExpected)}</span>
                </div>
              </div>
              <Form {...closeForm}>
                <form onSubmit={handleClose} className="space-y-4">
                  <FormField
                    control={closeForm.control}
                    name="jumlahTutup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jumlah Tutup (Kas di akhir)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="0"
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={closeForm.control}
                    name="catatan"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Catatan (Opsional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan catatan" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" disabled={closeMutation.isPending}>
                      {closeMutation.isPending ? 'Menutup...' : 'Tutup Shift'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
