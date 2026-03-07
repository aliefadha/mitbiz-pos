import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Eye, Search } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { StatCardsLaporan } from '@/components/dashboard/stat-cards-laporan';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { Label } from '@/components/ui/label';
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
import { type Order, ordersApi, type UpdateOrderDto } from '@/lib/api/orders';
import { outletsApi } from '@/lib/api/outlets';
import { useSession } from '@/lib/auth-client';

const formSchema = z.object({
  status: z.enum(['complete', 'cancel', 'refunded']).optional(),
  notes: z.string().optional(),
});

export function OrderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [outletFilter, setOutletFilter] = useState<string>('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: 'complete',
      notes: '',
    },
  });

  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return thirtyDaysAgo.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', tenantId, outletFilter, searchQuery, statusFilter],
    queryFn: () =>
      ordersApi.getAll({
        tenantId,
        outletId: outletFilter !== 'all' ? outletFilter : undefined,
        search: searchQuery || undefined,
        status:
          statusFilter !== 'all' ? (statusFilter as 'complete' | 'cancel' | 'refunded') : undefined,
      }),
    enabled: !!tenantId,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateOrderDto }) => ordersApi.update(id, data),
    onSuccess: () => {
      setEditModalOpen(false);
      setEditingOrder(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to update order');
    },
  });

  const handleView = (orderId: string) => {
    navigate({ to: '/orders/$orderId', params: { orderId } });
  };

  const handleSubmit = form.handleSubmit((values) => {
    if (editingOrder) {
      updateMutation.mutate({
        id: editingOrder.id,
        data: values,
      });
    }
  });

  const displayedOrders = ordersData?.data ?? [];

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

  return (
    <div className="flex flex-col gap-6 w-full">
      <div>
        <h4 className="text-lg font-semibold m-0">Pesanan</h4>
        <p className="text-sm text-gray-500 m-0">Kelola semua pesanan dalam sistem</p>
      </div>

      <StatCardsLaporan
        tenantId={tenantId}
        outletId={outletFilter !== 'all' ? outletFilter : undefined}
        startDate={startDate}
        endDate={endDate}
      />

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4 flex flex-col gap-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Cari</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari pesanan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Dari Tanggal</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Sampai Tanggal</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Outlet</Label>
              <Select value={outletFilter} onValueChange={setOutletFilter}>
                <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600">
                  <SelectValue placeholder="Semua Outlet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Outlet</SelectItem>
                  {outletsData?.data?.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="complete">Selesai</SelectItem>
                  <SelectItem value="cancel">Dibatalkan</SelectItem>
                  <SelectItem value="refunded">Dikembalikan</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {ordersLoading ? (
            <div className="p-6 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <Table>
              <TableHeader className="[&_tr]:border-b-0">
                <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                  <TableHead className=" text-gray-800 font-medium rounded-tl-lg rounded-bl-lg">
                    Nomor Pesanan
                  </TableHead>
                  <TableHead className=" text-gray-800 font-medium">Tanggal</TableHead>
                  <TableHead className=" text-gray-800 font-medium">Outlet</TableHead>
                  <TableHead className=" text-gray-800 font-medium">Kasir</TableHead>
                  <TableHead className=" text-gray-800 font-medium">Metode Pembayaran</TableHead>
                  <TableHead className=" text-gray-800 font-medium">Total</TableHead>
                  <TableHead className=" text-gray-800 font-medium w-[120px] rounded-tr-lg rounded-br-lg">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayedOrders.map((order) => (
                  <TableRow key={order.id} className="hover:bg-white">
                    <TableCell>
                      <span className="truncate max-w-[120px] block text-gray-900 font-medium ">
                        {order.orderNumber}
                      </span>
                    </TableCell>
                    <TableCell>{formatDate(order.createdAt)}</TableCell>
                    <TableCell>{order.outlet?.nama || '-'}</TableCell>
                    <TableCell>{order.cashier?.name || '-'}</TableCell>
                    <TableCell>
                      {order.paymentMethod?.nama ? (
                        <span className="border border-black/90 rounded-md px-2 py-1 text-sm">
                          {order.paymentMethod.nama}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>{formatRupiah(order.total)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleView(order.id)}
                        className="border"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!ordersLoading && ordersData?.meta && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Menampilkan {displayedOrders.length} dari {ordersData.meta.total} pesanan
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Pesanan</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit} className="space-y-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Pilih status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="complete">Selesai</SelectItem>
                        <SelectItem value="cancel">Dibatalkan</SelectItem>
                        <SelectItem value="refunded">Dikembalikan</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Catatan</FormLabel>
                    <FormControl>
                      <Input placeholder="Masukkan catatan (opsional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="submit" disabled={updateMutation.isPending || !tenantId}>
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
