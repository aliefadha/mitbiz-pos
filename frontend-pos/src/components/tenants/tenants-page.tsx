import { useQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { Building2, Loader2, MapPin, Phone, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { tenantsApi } from '@/lib/api/tenants';

export function TenantsPage() {
  const navigate = useNavigate();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['tenants-list'],
    queryFn: () => tenantsApi.getAll(),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen Bisnis</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola semua bisnis yang terdaftar</p>
        </div>
        <Button className="gap-2" onClick={() => navigate({ to: '/tenants/new' })}>
          <Plus className="h-4 w-4" />
          Tambah Bisnis
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : tenants.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">Belum ada bisnis</h3>
          <p className="mt-2 text-sm text-gray-500">Mulai dengan menambahkan bisnis baru.</p>
        </div>
      ) : (
        /* Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {tenants.map((tenant) => (
            <Card key={tenant.id} className="py-5 gap-0">
              <CardContent className="space-y-5">
                {/* Branch Name & Badge */}
                <div className="flex items-center justify-between">
                  <h3
                    className="text-base font-semibold text-gray-900 truncate pr-2"
                    title={tenant.nama}
                  >
                    {tenant.nama}
                  </h3>
                  <Badge
                    className={
                      tenant.isActive
                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                        : 'bg-gray-200 text-gray-600'
                    }
                  >
                    {tenant.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>

                {/* Address & Phone */}
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-gray-500">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0 text-gray-400" />
                    <span className="line-clamp-2">{tenant.alamat || '-'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-4 w-4 shrink-0 text-gray-400" />
                    <span>{tenant.noHp || '-'}</span>
                  </div>
                </div>

                {/* Optional: Add minimal stats if available from backend, else leave blank. */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Pengguna</p>
                    <p className="text-xl font-bold text-gray-900">{tenant.usersCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 mb-1">Outlet</p>
                    <p className="text-xl font-bold text-gray-900">{tenant.outletsCount || 0}</p>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="pt-2 border-t text-xs text-gray-400">
                  Dibuat {new Date(tenant.createdAt).toLocaleDateString('id-ID')}
                </div>
              </CardContent>

              {/* Footer Actions */}
              <CardFooter className="pt-4 px-6 gap-2 border-t mt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() =>
                    navigate({ to: '/tenants/$tenantId', params: { tenantId: tenant.id } })
                  }
                >
                  Detail
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
