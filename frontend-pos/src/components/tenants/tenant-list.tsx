import { Link } from '@tanstack/react-router';
import { Building2, MapPin, Phone, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Tenant } from '@/lib/api/tenants';

interface TenantListProps {
  displayedTenants: Tenant[];
  isLoading: boolean;
  canDelete: boolean;
  onDelete: (tenant: Tenant) => void;
}

export function TenantList({ displayedTenants, isLoading, canDelete, onDelete }: TenantListProps) {
  return (
    <div>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="py-5 gap-0">
              <CardContent>
                <Skeleton className="h-6 w-2/3 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : displayedTenants.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-sm font-semibold text-gray-900">Belum ada bisnis</h3>
          <p className="mt-2 text-sm text-gray-500">Mulai dengan menambahkan bisnis baru.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {displayedTenants.map((tenant) => (
            <Card key={tenant.id} className="py-5 gap-0">
              <CardContent className="space-y-5">
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

                <div className="pt-2 border-t text-xs text-gray-400">
                  Dibuat {new Date(tenant.createdAt).toLocaleDateString('id-ID')}
                </div>
              </CardContent>

              <CardFooter className="pt-4 px-6 gap-2 border-t mt-4">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/tenants/$tenantId" params={{ tenantId: tenant.id }}>
                    Detail
                  </Link>
                </Button>
                {canDelete && (
                  <Button variant="ghost" size="icon" onClick={() => onDelete(tenant)}>
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
