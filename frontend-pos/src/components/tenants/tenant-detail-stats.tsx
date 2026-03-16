import { Building2, Layers, Package, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { TenantSummary } from '@/lib/api/tenants';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  iconBgColor: string;
}

function StatCard({ icon, label, value, subtext, iconBgColor }: StatCardProps) {
  return (
    <Card className="py-4 gap-0">
      <CardContent className="flex items-center gap-4">
        <div className={`flex items-center justify-center h-12 w-12 rounded-xl ${iconBgColor}`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">{label}</p>
          <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
          {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

interface TenantDetailStatsProps {
  summary?: TenantSummary;
}

export function TenantDetailStats({ summary }: TenantDetailStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={<Building2 className="h-5 w-5 text-blue-600" />}
        iconBgColor="bg-blue-50"
        label="Total Outlet"
        value={summary?.outletsCount ?? 0}
      />
      <StatCard
        icon={<Layers className="h-5 w-5 text-violet-600" />}
        iconBgColor="bg-violet-50"
        label="Kategori"
        value={summary?.categoriesCount ?? 0}
      />
      <StatCard
        icon={<Package className="h-5 w-5 text-amber-600" />}
        iconBgColor="bg-amber-50"
        label="Produk"
        value={summary?.productsCount ?? 0}
      />
      <StatCard
        icon={<Users className="h-5 w-5 text-green-600" />}
        iconBgColor="bg-green-50"
        label="Pemilik"
        value={summary?.user?.name || summary?.user?.email || '—'}
      />
    </div>
  );
}
