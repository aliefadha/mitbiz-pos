import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { format, subDays } from 'date-fns';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { BranchStatusCard } from '@/components/dashboard/branch-status-card';
import { SalesByBranchChart } from '@/components/dashboard/sales-by-branch-chart';
import { SalesTrendChart } from '@/components/dashboard/sales-trend-chart';
import { StatCards } from '@/components/dashboard/stat-cards';
import { TopProductsChart } from '@/components/dashboard/top-products-chart';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { tenantsApi } from '@/lib/api/tenants';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/(global)/admin/')({
  component: DashboardPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('dashboard', 'read', 'global');
  },
});

function DashboardPage() {
  const [selectedTenantId, setSelectedTenantId] = useState<string>('all');

  const { startDate, endDate } = useMemo(() => {
    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);
    return {
      startDate: format(thirtyDaysAgo, 'yyyy-MM-dd'),
      endDate: format(now, 'yyyy-MM-dd'),
    };
  }, []);

  const { data: tenants } = useQuery({
    queryKey: ['tenants-list'],
    queryFn: () => tenantsApi.getAll(),
  });

  const tenantId = selectedTenantId === 'all' ? undefined : selectedTenantId;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto pb-10">
      {/* Header */}
      <div>
        <h1 className="text-lg font-bold tracking-tight text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Overview dan statistik bisnis</p>
      </div>

      {/* Search bar & Tenant selector */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Cari informasi bisnis..." className="pl-9" />
        </div>
        <Select value={selectedTenantId} onValueChange={setSelectedTenantId}>
          <SelectTrigger className="w-full sm:w-[220px]">
            <SelectValue placeholder="Pilih bisnis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Bisnis</SelectItem>
            {tenants?.map((tenant) => (
              <SelectItem key={tenant.id} value={tenant.id}>
                {tenant.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stat Cards */}
      <StatCards tenantId={tenantId} startDate={startDate} endDate={endDate} />

      {/* Charts Row 1: Tren Penjualan + Penjualan per Cabang */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SalesTrendChart tenantId={tenantId} startDate={startDate} endDate={endDate} />
        <SalesByBranchChart tenantId={tenantId} startDate={startDate} endDate={endDate} />
      </div>

      {/* Charts Row 2: Top 5 Produk + Status Cabang */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopProductsChart tenantId={tenantId} startDate={startDate} endDate={endDate} />
        <BranchStatusCard tenantId={tenantId} />
      </div>
    </div>
  );
}
