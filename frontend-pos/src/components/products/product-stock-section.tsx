import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/use-auth';
import { outletsApi } from '@/lib/api/outlets';
import type { Product } from '@/lib/api/products';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';
import { stocksApi } from '@/lib/api/stocks';

interface ProductStockSectionProps {
  product: Product;
}

export function ProductStockSection({ product }: ProductStockSectionProps) {
  const productId = product.id;
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const canCreateStock = hasPermission('stocks', 'create');
  const canReadStock = hasPermission('stocks', 'read');
  const canReadAdjustments = hasPermission('stockAdjustments', 'read');

  const [createStockModalOpen, setCreateStockModalOpen] = useState(false);
  const [createStockQuantity, setCreateStockQuantity] = useState(0);
  const [selectedOutletId, setSelectedOutletId] = useState<string>('');

  const handleOpenChange = (open: boolean) => {
    setCreateStockModalOpen(open);
    if (!open) {
      setSelectedOutletId('');
      setCreateStockQuantity(0);
    }
  };

  const { data: outletsData } = useQuery({
    queryKey: ['outlets'],
    queryFn: () => outletsApi.getAll(),
  });

  const { data: stocksData } = useQuery({
    queryKey: ['stocks', productId],
    queryFn: () => stocksApi.getAll({ productId }),
    enabled: !!productId && canReadStock,
  });

  const { data: adjustmentsData } = useQuery({
    queryKey: ['stock-adjustments', productId],
    queryFn: () => stockAdjustmentsApi.getAll({ productId: productId }),
    enabled: !!productId && canReadAdjustments,
  });

  const createStockMutation = useMutation({
    mutationFn: (data: { productId: string; outletId: string; quantity: number }) =>
      stocksApi.create(data),
    onSuccess: () => {
      setCreateStockModalOpen(false);
      setCreateStockQuantity(0);
      setSelectedOutletId('');
      queryClient.invalidateQueries({ queryKey: ['stocks', productId] });
      toast.success('Stok berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const stocks = stocksData?.data || [];
  const adjustments = adjustmentsData?.data || [];

  const getStockColor = (quantity: number) => {
    if (quantity <= 0) return 'bg-red-100 text-red-700';
    if (quantity <= product.minStockLevel) return 'bg-orange-100 text-orange-700';
    return 'bg-green-100 text-green-700';
  };

  if (!canReadStock && !canReadAdjustments) {
    return null;
  }

  return (
    <>
      {canReadStock && (
        <Card className="mb-6 relative">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ringkasan Stok</CardTitle>
            {stocks.length === 0 && canCreateStock && (
              <Button size="sm" onClick={() => setCreateStockModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Tambah Stok
              </Button>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Jumlah Stok</p>
                <p className="text-2xl font-bold">
                  {stocks.reduce((sum, s) => sum + s.quantity, 0)}
                </p>
                <p className="text-xs text-gray-400">{product.unit}</p>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Minimum Stok</p>
                <p className="text-2xl font-bold">{product.minStockLevel}</p>
                <p className="text-xs text-gray-400">{product.unit}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="relative">
        <CardContent>
          <Tabs defaultValue={canReadStock ? 'stocks' : 'adjustments'}>
            <TabsList>
              {canReadStock && (
                <TabsTrigger value="stocks" className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Stok ({stocks.length})
                </TabsTrigger>
              )}
              {canReadAdjustments && (
                <TabsTrigger value="adjustments" className="flex items-center gap-2">
                  <History className="h-4 w-4" />
                  Riwayat ({adjustments.length})
                </TabsTrigger>
              )}
            </TabsList>

            {canReadStock && (
              <TabsContent value="stocks">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Terakhir Diupdate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stocks.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                          Stok belum ada. Klik &quot;Tambah Stok&quot; untuk membuat.
                        </TableCell>
                      </TableRow>
                    ) : (
                      stocks.map((stock) => (
                        <TableRow key={stock.id}>
                          <TableCell>
                            {stock.outlet ? `${stock.outlet.nama} (${stock.outlet.kode})` : '-'}
                          </TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded ${getStockColor(stock.quantity)}`}>
                              {stock.quantity}
                            </span>
                          </TableCell>
                          <TableCell>{new Date(stock.updatedAt).toLocaleString('id-ID')}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TabsContent>
            )}

            {canReadAdjustments && (
              <TabsContent value="adjustments">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tanggal</TableHead>
                      <TableHead>Outlet</TableHead>
                      <TableHead>Jumlah</TableHead>
                      <TableHead>Alasan</TableHead>
                      <TableHead>Oleh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {adjustments.map((adj) => (
                      <TableRow key={adj.id}>
                        <TableCell>{new Date(adj.createdAt).toLocaleString('id-ID')}</TableCell>
                        <TableCell>
                          {adj.outlet ? `${adj.outlet.nama} (${adj.outlet.kode})` : '-'}
                        </TableCell>
                        <TableCell>
                          <span className={adj.quantity >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {adj.quantity > 0 ? `+${adj.quantity}` : adj.quantity}
                          </span>
                        </TableCell>
                        <TableCell>{adj.alasan || '-'}</TableCell>
                        <TableCell>{adj.user?.name || adj.user?.email || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            )}
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={createStockModalOpen} onOpenChange={handleOpenChange}>
        <DialogContent className="max-[400px]">
          <DialogHeader>
            <DialogTitle>Tambah Stok</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <label className="text-sm font-medium">Outlet</label>
              <Select
                value={selectedOutletId}
                onValueChange={(value) => setSelectedOutletId(value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Pilih Outlet" />
                </SelectTrigger>
                <SelectContent>
                  {outletsData?.data.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.nama} ({outlet.kode})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Jumlah</label>
              <Input
                type="number"
                value={createStockQuantity}
                onChange={(e) => setCreateStockQuantity(Number(e.target.value))}
                className="mt-1"
                placeholder="Contoh: 100"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={
                !selectedOutletId || createStockQuantity <= 0 || createStockMutation.isPending
              }
              onClick={() => {
                createStockMutation.mutate({
                  productId,
                  outletId: selectedOutletId,
                  quantity: createStockQuantity,
                });
              }}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
