import { Card, CardContent } from '@/components/ui/card';
import type { CashShift } from '@/lib/api/cash-shifts';

interface CashShiftInfoCardProps {
  cashShift: CashShift;
}

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'buka':
      return 'bg-green-100 text-green-700';
    case 'tutup':
      return 'bg-gray-100 text-gray-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'buka':
      return 'Buka';
    case 'tutup':
      return 'Tutup';
    default:
      return status;
  }
};

export function CashShiftInfoCard({ cashShift }: CashShiftInfoCardProps) {
  return (
    <Card className="mb-6">
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-500">Status</span>
            <span
              className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusColor(
                cashShift.status
              )}`}
            >
              {getStatusLabel(cashShift.status)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Outlet</span>
            <span className="font-medium">{cashShift.outlet?.nama || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Kasir</span>
            <span className="font-medium">{cashShift.cashier?.name || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Waktu Buka</span>
            <span className="font-medium">{formatDate(cashShift.openedAt)}</span>
          </div>
          {cashShift.closedAt && (
            <div className="flex justify-between">
              <span className="text-gray-500">Waktu Tutup</span>
              <span className="font-medium">{formatDate(cashShift.closedAt)}</span>
            </div>
          )}
          {cashShift.catatan && (
            <div>
              <span className="text-gray-500">Catatan</span>
              <p className="font-medium mt-1">{cashShift.catatan}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
