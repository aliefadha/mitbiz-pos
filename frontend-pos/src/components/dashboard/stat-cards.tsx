import { IconReceipt2 } from '@tabler/icons-react';
import { useQuery } from '@tanstack/react-query';
import { BadgePercent, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardApi } from '@/lib/api/dashboard';

interface StatCardsProps {
  tenantId?: string;
  outletId?: string;
  startDate?: string;
  endDate?: string;
}

export function StatCards({ tenantId, outletId, startDate, endDate }: StatCardsProps) {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', tenantId, outletId, startDate, endDate],
    queryFn: () => dashboardApi.getStats({ tenantId, outletId, startDate, endDate }),
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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="bg-[#0B6CE6] text-white border-0 shadow-sm relative overflow-hidden">
        <div className="absolute -bottom-4 -right-1">
          <img src="/images/mitbiz-white.png" alt="Logo" className="w-24 h-24 object-contain" />
        </div>

        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-blue-100">Total Penjualan</CardTitle>
          <div className="p-1.5 border border-blue-400 rounded-md bg-blue-500/20">
            <IconReceipt2 className="h-4 w-4 text-white" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold mt-2">
            {isLoading ? '...' : formatCurrency(stats?.totalPenjualan || 0)}
          </div>
          <p className="text-xs text-blue-100 mt-2 font-medium">
            {isLoading ? '...' : `${stats?.totalTransaksi || 0} transaksi`}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-700">Cabang Aktif</CardTitle>
          <div className="p-1.5 border border-gray-200 rounded-md">
            <BadgePercent className="h-4 w-4 text-gray-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {isLoading ? '...' : stats?.cabangAktif || 0}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {isLoading ? '...' : `dari ${stats?.totalCabang || 0} total`}
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-700">Kasir Aktif</CardTitle>
          <div className="p-1.5 border border-gray-200 rounded-md">
            <Users className="h-4 w-4 text-gray-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {isLoading ? '...' : stats?.kasirAktif || 0}
          </div>
          <p className="text-xs text-gray-500 mt-2">kasir terdaftar</p>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-sm font-medium text-gray-700">Produk Aktif</CardTitle>
          <div className="p-1.5 border border-gray-200 rounded-md">
            <BadgePercent className="h-4 w-4 text-gray-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-gray-900 mt-2">
            {isLoading ? '...' : stats?.produkAktif || 0}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {isLoading ? '...' : `dari ${stats?.totalProduk || 0} total`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
