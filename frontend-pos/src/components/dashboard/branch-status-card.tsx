import { useQuery } from '@tanstack/react-query';
import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { type Outlet, outletsApi } from '@/lib/api/outlets';

interface BranchStatusCardProps {
  tenantId?: string;
}

export function BranchStatusCard({ tenantId }: BranchStatusCardProps) {
  const { data: outletsData, isLoading } = useQuery({
    queryKey: ['dashboard-outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId, limit: 100 }),
  });

  const outlets = outletsData?.data || [];

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">Status Cabang</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="h-10 w-10 bg-gray-200 rounded-lg" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {outlets.map((outlet: Outlet) => (
              <div key={outlet.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center h-10 w-10 bg-gray-100 rounded-lg">
                    <Building2 className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{outlet.nama}</p>
                    <p className="text-xs text-gray-400">{outlet.alamat || 'Alamat belum diisi'}</p>
                  </div>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    outlet.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {outlet.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </div>
            ))}
            {outlets.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">Belum ada cabang</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
