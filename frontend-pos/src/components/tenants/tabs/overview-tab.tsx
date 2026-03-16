import { Calendar, Globe, Mail, MapPin, Phone, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Tenant } from '@/lib/api/tenants';

function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

interface OverviewTabProps {
  tenant: Tenant;
}

export function OverviewTab({ tenant }: OverviewTabProps) {
  const infoItems = [
    {
      icon: <MapPin className="h-4 w-4 text-gray-400" />,
      label: 'Alamat',
      value: tenant.alamat || 'Belum diatur',
    },
    {
      icon: <Phone className="h-4 w-4 text-gray-400" />,
      label: 'Telepon',
      value: tenant.noHp || 'Belum diatur',
    },
    {
      icon: <Mail className="h-4 w-4 text-gray-400" />,
      label: 'Email Pemilik',
      value: tenant.user?.email || '—',
    },
    {
      icon: <Globe className="h-4 w-4 text-gray-400" />,
      label: 'Slug',
      value: tenant.slug,
    },
    {
      icon: <Calendar className="h-4 w-4 text-gray-400" />,
      label: 'Terdaftar Sejak',
      value: formatDate(tenant.createdAt),
    },
  ];

  return (
    <div className="pt-2 space-y-5">
      <Card className="py-4 gap-0">
        <CardContent>
          <h3 className="text-sm font-semibold text-gray-900 mb-4">Informasi Bisnis</h3>
          <div className="space-y-0 divide-y divide-gray-100">
            {infoItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50 shrink-0">
                  {item.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-400">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="py-4 gap-0">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900">Pengaturan</h3>
            <Settings className="h-4 w-4 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Pajak</p>
              <p className="text-lg font-bold text-gray-900">
                {tenant.settings?.taxRate !== undefined ? `${tenant.settings.taxRate}%` : '0%'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">Mata Uang</p>
              <p className="text-lg font-bold text-gray-900">
                {tenant.settings?.currency || 'IDR'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
