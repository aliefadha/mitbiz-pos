import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { Upload } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SalesByBranchChart } from '@/components/dashboard/sales-by-branch-chart';
import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart';
import { StatCardsLaporan } from '@/components/dashboard/stat-cards-laporan';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useTenant } from '@/contexts/tenant-context';
import { type Category, categoriesApi } from '@/lib/api/categories';
import { type Outlet, outletsApi } from '@/lib/api/outlets';
import { salesApi, type TopProduct } from '@/lib/api/sales';

export const Route = createFileRoute('/_protected/laporan')({
  component: LaporanPage,
});

function LaporanPage() {
  const { selectedTenant } = useTenant();

  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return thirtyDaysAgo.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedOutletId, setSelectedOutletId] = useState<string>('all');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', selectedTenant?.id],
    queryFn: () => outletsApi.getAll({ tenantId: selectedTenant?.id }),
    enabled: !!selectedTenant?.id,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', selectedTenant?.id],
    queryFn: () => categoriesApi.getAll({ tenantId: selectedTenant?.id }),
    enabled: !!selectedTenant?.id,
  });

  const outlets: Outlet[] = outletsData?.data ?? [];
  const categories: Category[] = categoriesData?.data ?? [];

  const queryParams = useMemo(
    () => ({
      startDate,
      endDate,
      tenantId: selectedTenant?.id,
      outletId: selectedOutletId === 'all' ? undefined : selectedOutletId,
    }),
    [startDate, endDate, selectedTenant?.id, selectedOutletId]
  );

  const { data: topProducts, isLoading: loadingTopProducts } = useQuery({
    queryKey: ['sales-top-products', queryParams],
    queryFn: () => salesApi.getTopProducts({ ...queryParams, limit: 10 }),
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-gray-900">Laporan Penjualan</h1>
          <p className="text-gray-500 text-sm mt-1">Analisis dan laporan penjualan lengkap</p>
        </div>
        <Button className="bg-[#0B6CE6] text-white hover:bg-[#0B6CE6]/90 gap-2 rounded-lg">
          <Upload className="w-4 h-4" />
          Ekspor Laporan
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Periode</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600"
                />
                <span className="text-gray-400">-</span>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Cabang</Label>
              <Select value={selectedOutletId} onValueChange={setSelectedOutletId}>
                <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600">
                  <SelectValue placeholder="Semua Cabang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Cabang</SelectItem>
                  {outlets.map((outlet) => (
                    <SelectItem key={outlet.id} value={outlet.id}>
                      {outlet.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-semibold text-gray-700">Kategori</Label>
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600">
                  <SelectValue placeholder="Produk Terlaris" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Kategori</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <StatCardsLaporan {...queryParams} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SalesTrendChart {...queryParams} />
        <SalesByBranchChart {...queryParams} />
      </div>

      <TopProductsTable
        data={topProducts}
        isLoading={loadingTopProducts}
        formatCurrency={formatCurrency}
      />
    </div>
  );
}

function TopProductsTable({
  data,
  isLoading,
  formatCurrency,
}: {
  data?: TopProduct[];
  isLoading: boolean;
  formatCurrency: (value: number) => string;
}) {
  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden">
      <div className="p-6 pb-4 bg-white">
        <h3 className="text-sm font-bold text-gray-900">10 Produk Terlaris</h3>
      </div>
      <div className="relative w-full overflow-x-auto px-4 pb-4">
        <div className="rounded-lg overflow-hidden bg-white">
          <table className="w-full caption-bottom text-sm border-collapse">
            <thead>
              <tr className="bg-[#F1F2F4]">
                <th className="h-11 px-4 text-left align-middle font-semibold text-gray-700 w-24 rounded-tl-lg">
                  Peringkat
                </th>
                <th className="h-11 px-4 text-left align-middle font-semibold text-gray-700">
                  Produk
                </th>
                <th className="h-11 px-4 text-left align-middle font-semibold text-gray-700">
                  Jumlah Produk
                </th>
                <th className="h-11 px-4 text-left align-middle font-semibold text-gray-700 rounded-tr-lg">
                  Total Pendapatan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="h-24 text-center text-gray-500 border-b border-gray-100"
                  >
                    Memuat...
                  </td>
                </tr>
              ) : data?.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="h-24 text-center text-gray-500 border-b border-gray-100"
                  >
                    Tidak ada data
                  </td>
                </tr>
              ) : (
                data?.map((product, index) => (
                  <tr
                    key={product.productId}
                    className="border-b border-gray-100/60 transition-colors hover:bg-gray-50/50"
                  >
                    <td className="py-4 px-4 align-middle text-gray-500">{index + 1}</td>
                    <td className="py-4 px-4 align-middle font-medium text-gray-600">
                      {product.productName}
                      {product.productSku && (
                        <span className="text-gray-400 text-xs ml-1">({product.productSku})</span>
                      )}
                    </td>
                    <td className="py-4 px-4 align-middle text-gray-500">
                      {product.totalQuantity}
                    </td>
                    <td className="py-4 px-4 align-middle font-medium text-gray-600">
                      {formatCurrency(product.totalRevenue)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Card>
  );
}
