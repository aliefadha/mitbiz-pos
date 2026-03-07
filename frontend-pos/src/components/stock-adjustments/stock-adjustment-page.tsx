import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Textarea } from '@/components/ui/textarea';
import { outletsApi } from '@/lib/api/outlets';
import { productsApi } from '@/lib/api/products';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';
import { useSession } from '@/lib/auth-client';

export function StockAdjustmentPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;
  const userId = session?.user?.id;
  const [searchQuery, setSearchQuery] = useState('');
  const [outletFilter, setOutletFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [alasan, setAlasan] = useState<string>('');

  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ['stock-adjustments', tenantId, outletFilter, currentPage, pageSize],
    queryFn: () =>
      stockAdjustmentsApi.getAll({
        outletId: outletFilter || undefined,
        page: currentPage,
        limit: pageSize,
      }),
    enabled: !!tenantId,
  });

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', tenantId, selectedOutlet],
    queryFn: () =>
      productsApi.getAll({ tenantId, outletId: selectedOutlet || undefined, limit: 100 }),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: stockAdjustmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to create stock adjustment');
    },
  });

  const resetForm = () => {
    setSelectedOutlet('');
    setSelectedProduct('');
    setQuantity('');
    setAlasan('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutlet || !selectedProduct || !quantity || !userId) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    createMutation.mutate({
      outletId: selectedOutlet,
      productId: selectedProduct,
      quantity: parseInt(quantity, 10),
      alasan: alasan || undefined,
      adjustedBy: userId,
    });
  };

  const displayedAdjustments = adjustmentsData?.data ?? [];
  const outlets = outletsData?.data ?? [];
  const products = productsData?.data ?? [];

  const filteredAdjustments = searchQuery
    ? displayedAdjustments.filter(
        (adjustment) =>
          adjustment.product?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          adjustment.product?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          adjustment.outlet?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          adjustment.alasan?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : displayedAdjustments;

  const getAdjustmentType = (quantity: number) => {
    if (quantity > 0) return 'Tambah';
    if (quantity < 0) return 'Kurang';
    return '-';
  };

  const getAdjustmentTypeColor = (quantity: number) => {
    if (quantity > 0) return 'bg-green-100 text-green-700';
    if (quantity < 0) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
  };

  return (
    <>
      <div>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-lg font-semibold m-0">Penyesuaian Stok</h4>
            <p className="text-sm text-gray-500 m-0">Tambah atau kurangi stok produk</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Tambah Penyesuaian
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Tambah Penyesuaian Stok</DialogTitle>
                <DialogDescription>
                  Tambah atau kurangi stok produk di outlet tertentu.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="outlet">Outlet *</Label>
                    <Select value={selectedOutlet} onValueChange={setSelectedOutlet}>
                      <SelectTrigger id="outlet">
                        <SelectValue placeholder="Pilih outlet" />
                      </SelectTrigger>
                      <SelectContent>
                        {outlets.map((outlet) => (
                          <SelectItem key={outlet.id} value={outlet.id}>
                            {outlet.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="product">Produk *</Label>
                    <Select
                      value={selectedProduct}
                      onValueChange={setSelectedProduct}
                      disabled={!selectedOutlet}
                    >
                      <SelectTrigger id="product">
                        <SelectValue
                          placeholder={
                            selectedOutlet ? 'Pilih produk' : 'Pilih outlet terlebih dahulu'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.nama} ({product.sku})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="quantity">Jumlah Penyesuaian *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      placeholder="Contoh: 10 (tambah) atau -5 (kurang)"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                    />
                    <p className="text-xs text-gray-500">
                      Gunakan nilai positif untuk menambah stok, negatif untuk mengurangi.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="alasan">Alasan</Label>
                    <Textarea
                      id="alasan"
                      placeholder="Alasan penyesuaian stok (opsional)"
                      value={alasan}
                      onChange={(e) => setAlasan(e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || !selectedOutlet || !selectedProduct || !quantity
                    }
                  >
                    {createMutation.isPending ? 'Menyimpan...' : 'Simpan'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <Card>
          <CardContent>
            <h4 className="text-base font-semibold mb-6">Daftar Penyesuaian</h4>
            <div className="grid grid-cols-2 gap-2 mb-6 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari produk, outlet, atau alasan..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="pl-9 w-full"
                />
              </div>
              <Select
                value={outletFilter || 'all'}
                onValueChange={(value) => {
                  setOutletFilter(value === 'all' ? '' : value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Semua Outlet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Outlet</SelectItem>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {adjustmentsLoading ? (
              <div className="p-6 space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : (
              <Table>
                <TableHeader className="[&_tr]:border-b-0">
                  <TableRow className="bg-gray-100 hover:bg-gray-100 border-b-0">
                    <TableHead className="text-gray-800 font-medium rounded-tl-lg rounded-bl-lg">
                      Tanggal
                    </TableHead>
                    <TableHead className="text-gray-800 font-medium">Produk</TableHead>
                    <TableHead className="text-gray-800 font-medium">Outlet</TableHead>
                    <TableHead className="text-gray-800 font-medium">Tipe</TableHead>
                    <TableHead className="text-gray-800 font-medium">Jumlah</TableHead>
                    <TableHead className="text-gray-800 font-medium rounded-tr-lg rounded-br-lg">
                      Alasan
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdjustments.length === 0 ? (
                    <TableRow className="hover:bg-white">
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Tidak ada data penyesuaian stok
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAdjustments.map((adjustment) => (
                      <TableRow key={adjustment.id} className="hover:bg-white">
                        <TableCell>
                          {adjustment.createdAt
                            ? new Date(adjustment.createdAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })
                            : '-'}
                        </TableCell>
                        <TableCell>{adjustment.product?.nama || 'Unknown Product'}</TableCell>
                        <TableCell>{adjustment.outlet?.nama || '-'}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${getAdjustmentTypeColor(adjustment.quantity)}`}
                          >
                            {adjustment.quantity > 0 ? (
                              <ArrowUp className="h-3 w-3" />
                            ) : adjustment.quantity < 0 ? (
                              <ArrowDown className="h-3 w-3" />
                            ) : null}
                            {getAdjustmentType(adjustment.quantity)}
                          </span>
                        </TableCell>
                        <TableCell>{adjustment.quantity}</TableCell>
                        <TableCell>
                          <span className="text-sm text-gray-600">{adjustment.alasan || '-'}</span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            {adjustmentsData?.meta && (
              <div className="flex items-center justify-between px-2 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Menampilkan {(currentPage - 1) * pageSize + 1} -{' '}
                    {Math.min(currentPage * pageSize, adjustmentsData.meta.total)} dari{' '}
                    {adjustmentsData.meta.total} penyesuaian
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
                      const totalPages = adjustmentsData.meta.totalPages;
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
                    disabled={currentPage === adjustmentsData.meta.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
