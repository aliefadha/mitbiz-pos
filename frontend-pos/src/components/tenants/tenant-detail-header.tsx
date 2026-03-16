import { MapPin, Pencil, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Tenant } from '@/lib/api/tenants';

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

interface TenantDetailHeaderProps {
  tenant: Tenant;
}

export function TenantDetailHeader({ tenant }: TenantDetailHeaderProps) {
  return (
    <Card className="py-5 gap-0">
      <CardContent>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="flex items-center justify-center h-14 w-14 rounded-2xl bg-blue-500 text-white text-xl font-bold shrink-0">
              {tenant.nama.charAt(0).toUpperCase()}
            </div>

            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <h1 className="text-xl font-bold text-gray-900">{tenant.nama}</h1>
                <Badge
                  className={
                    tenant.isActive
                      ? 'bg-green-100 text-green-700 hover:bg-green-100'
                      : 'bg-red-100 text-red-700 hover:bg-red-100'
                  }
                >
                  {tenant.isActive ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-500 mt-2">
                {tenant.alamat && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {tenant.alamat}
                  </span>
                )}
                {tenant.noHp && (
                  <span className="flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {tenant.noHp}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-400 mt-2">
                Terdaftar sejak {formatDate(tenant.createdAt)}
              </p>
            </div>
          </div>

          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
