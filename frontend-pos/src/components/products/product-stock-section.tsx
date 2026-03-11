import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { History, Package, Plus, ShoppingCart } from 'lucide-react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useTenant } from '@/contexts/tenant-context';
import { usePermissions } from '@/hooks/use-auth';
import type { Product } from '@/lib/api/products';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';
import { stocksApi } from '@/lib/api/stocks';
import { useSession } from '@/lib/auth-client';

interface ProductStockSectionProps {
  product: Product;
}

export function ProductStockSection({ product }: ProductStockSectionProps) {
  const productId = product.id;
  const queryClient = useQueryClient();
  const { selectedOutlet } = useTenant();
  const { data: session } = useSession();
  const { hasPermission } = usePermissions();

  const canCreateStock = hasPermission('stocks', 'create');
  const canAdjustStock = hasPermission('stockAdjustments', 'create');
  const canReadStock = hasPermission('stocks', 'read');
  const canReadAdjustments = hasPermission('stockAdjustments', 'read');

  const [createStockModalOpen, setCreateStockModalOpen] = useState(false);
  const [createStockQuantity, setCreateStockQuantity] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');

  const { data: stocksData } = useQuery({
    queryKey: ['stocks', productId, selectedOutlet?.id],
    queryFn: () => stocksApi.getAll({ productId, outletId: selectedOutlet?.id }),
    enabled: !!productId && canReadStock,
  });

  const { data: adjustmentsData } = useQuery({
    queryKey: ['stock-adjustments', productId, selectedOutlet?.id],
    queryFn: () =>
      stockAdjustmentsApi.getAll({ productId: productId, outletId: selectedOutlet?.id }),
    enabled: !!productId && canReadAdjustments,
  });

  const createStockMutation = useMutation({
    mutationFn: (data: { productId: string; outletId: string; quantity: number }) =>
      stocksApi.create(data),
    onSuccess: () => {
      setCreateStockModalOpen(false);
      setCreateStockQuantity(0);
      queryClient.invalidateQueries({ queryKey: ['stocks', productId, selectedOutlet?.id] });
      toast.success('Stok berhasil ditambahkan');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const adjustStockMutation = useMutation({
    mutationFn: (data: {
      productId: string;
      outletId: string;
      quantity: number;
      alasan: string;
      adjustedBy: string;
    }) => stockAdjustmentsApi.create(data),
    onSuccess: () => {
      setCreateStockModalOpen(false);
      setCreateStockQuantity(0);
      setAdjustmentReason('');
      queryClient.invalidateQueries({ queryKey: ['stocks', productId, selectedOutlet?.id] });
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments', productId] });
      toast.success('Stok berhasil disesuaikan');
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

  const hasStockPermission = canCreateStock || canAdjustStock;

  if (!canReadStock && !canReadAdjustments) {
    return null;
  }

  return (
    <>
      {canReadStock && (
        <Card className="mb-6 relative">
          {stocks.length === 0 && selectedOutlet && hasStockPermission && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center rounded-lg">
              <p className="text-gray-500 mb-4">Stok belum ada untuk outlet ini</p>
              {canCreateStock && (
                <Button onClick={() => setCreateStockModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Stok
                </Button>
              )}
            </div>
          )}
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ringkasan Stok</CardTitle>
            {selectedOutlet &&
              hasStockPermission &&
              (stocks.length > 0
                ? canAdjustStock && (
                    <Button size="sm" onClick={() => setCreateStockModalOpen(true)}>
                      <Package className="h-4 w-4 mr-2" />
                      Sesuaikan Stok
                    </Button>
                  )
                : canCreateStock && (
                    <Button size="sm" onClick={() => setCreateStockModalOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Tambah Stok
                    </Button>
                  ))}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-500">Jumlah Stok</p>
                <p className="text-2xl font-bold">
                  {selectedOutlet
                    ? (stocks.find((s) => s.outletId === selectedOutlet.id)?.quantity ?? 0)
                    : stocks.reduce((sum, s) => sum + s.quantity, 0)}
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
          {selectedOutlet ? (
            stocks.length > 0 ? (
              <>
                <h3 className="text-lg font-semibold mb-4">Riwayat Stok</h3>
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
              </>
            ) : null
          ) : (
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
                              <span
                                className={`px-2 py-1 rounded ${getStockColor(stock.quantity)}`}
                              >
                                {stock.quantity}
                              </span>
                            </TableCell>
                            <TableCell>
                              {new Date(stock.updatedAt).toLocaleString('id-ID')}
                            </TableCell>
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
          )}
        </CardContent>
      </Card>

      <Dialog open={createStockModalOpen} onOpenChange={setCreateStockModalOpen}>
        <DialogContent className="max-[400px]">
          <DialogHeader>
            <DialogTitle>{stocks.length > 0 ? 'Sesuaikan Stok' : 'Tambah Stok'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {stocks.length === 0 && selectedOutlet && (
              <div className="text-sm text-gray-500">
                Outlet:{' '}
                <span className="font-medium text-gray-900">
                  {selectedOutlet.nama} ({selectedOutlet.kode})
                </span>
              </div>
            )}
            <div>
              <label className="text-sm font-medium">
                {stocks.length > 0 ? 'Jumlah Penyesuaian (negatif untuk mengurangi)' : 'Jumlah'}
              </label>
              <Input
                type="number"
                value={createStockQuantity}
                onChange={(e) => setCreateStockQuantity(Number(e.target.value))}
                className="mt-1"
                placeholder={stocks.length > 0 ? 'Contoh: 10 atau -5' : 'Contoh: 100'}
              />
              {stocks.length > 0 && createStockQuantity !== 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  Stok akan berubah dari{' '}
                  <span className="font-medium">
                    {stocks.length > 0
                      ? (stocks.find((s) =>
                          selectedOutlet ? s.outletId === selectedOutlet.id : true
                        )?.quantity ?? 0)
                      : 0}
                  </span>{' '}
                  menjadi{' '}
                  <span className="font-medium text-green-600">
                    {(stocks.find((s) => (selectedOutlet ? s.outletId === selectedOutlet.id : true))
                      ?.quantity ?? 0) + createStockQuantity}
                  </span>
                </p>
              )}
            </div>
            {stocks.length > 0 && (
              <div>
                <label className="text-sm font-medium">Alasan</label>
                <Input
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="mt-1"
                  placeholder="Contoh: Koreksi stok, barang rusak, dll"
                  required
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              type="button"
              disabled={
                (stocks.length === 0 &&
                  (!selectedOutlet || createStockQuantity <= 0 || createStockMutation.isPending)) ||
                (stocks.length > 0 &&
                  (createStockQuantity === 0 ||
                    !adjustmentReason.trim() ||
                    !session?.user ||
                    adjustStockMutation.isPending))
              }
              onClick={() => {
                if (stocks.length === 0 && selectedOutlet) {
                  createStockMutation.mutate({
                    productId,
                    outletId: selectedOutlet.id,
                    quantity: createStockQuantity,
                  });
                } else {
                  const outletId = selectedOutlet?.id || stocks[0]?.outletId;
                  if (outletId && session?.user) {
                    adjustStockMutation.mutate({
                      productId,
                      outletId,
                      quantity: createStockQuantity,
                      alasan: adjustmentReason,
                      adjustedBy: session.user.id,
                    });
                  }
                }
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
