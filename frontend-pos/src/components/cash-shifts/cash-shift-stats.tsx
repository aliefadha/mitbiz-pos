import { Store } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface CashShiftStatsProps {
  totalShifts: number;
  openShifts: number;
  totalSalesToday?: number;
}

const formatRupiah = (value: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

export function CashShiftStats({
  totalShifts,
  openShifts,
  totalSalesToday = 0,
}: CashShiftStatsProps) {
  const stats = [
    {
      title: 'Shift Aktif',
      value: openShifts,
      format: 'number' as const,
    },
    {
      title: 'Shift Hari Ini',
      value: totalShifts,
      format: 'number' as const,
    },
    {
      title: 'Penjualan Hari Ini',
      value: totalSalesToday,
      format: 'currency' as const,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      {stats.map((stat) => (
        <Card key={stat.title} className="shadow-sm border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
            <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-gray-50">
              <Store className="h-4 w-4 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {stat.format === 'currency' ? formatRupiah(stat.value) : stat.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
