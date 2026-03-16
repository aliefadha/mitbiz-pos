import { Globe, Package, TrendingUp } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Tenant } from '@/lib/api/tenants';

interface SettingsTabProps {
  tenant: Tenant;
}

export function SettingsTab({ tenant }: SettingsTabProps) {
  const settings = tenant.settings;

  const settingItems = [
    {
      icon: <Globe className="h-4 w-4 text-blue-500" />,
      label: 'Zona Waktu',
      value: settings?.timezone || 'Asia/Jakarta',
    },
    {
      icon: <span className="text-sm font-medium text-green-600">Rp</span>,
      label: 'Mata Uang',
      value: settings?.currency || 'IDR',
    },
    {
      icon: <TrendingUp className="h-4 w-4 text-amber-500" />,
      label: 'Tarif Pajak',
      value: settings?.taxRate !== undefined ? `${settings.taxRate}%` : '0%',
    },
    {
      icon: <Package className="h-4 w-4 text-purple-500" />,
      label: 'Footer Struk',
      value: settings?.receiptFooter || 'Terima kasih telah berbelanja',
    },
  ];

  return (
    <div className="pt-2">
      <Card className="py-4 gap-0">
        <CardContent className="divide-y divide-gray-100">
          {settingItems.map((item, idx) => (
            <div
              key={idx}
              className={`flex items-center justify-between py-3.5 ${idx === 0 ? 'pt-0' : ''} ${idx === settingItems.length - 1 ? 'pb-0' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50">
                  {item.icon}
                </div>
                <span className="text-sm text-gray-500">{item.label}</span>
              </div>
              <span className="text-sm font-medium text-gray-900">{item.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
