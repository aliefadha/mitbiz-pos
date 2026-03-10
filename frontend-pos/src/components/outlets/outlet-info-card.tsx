import { Package } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import type { Outlet } from '@/lib/api/outlets';

interface OutletInfoCardProps {
  outlet: Outlet;
}

export function OutletInfoCard({ outlet }: OutletInfoCardProps) {
  return (
    <Card className="mb-6">
      <CardContent>
        <div className="flex items-center gap-2 mb-4">
          <Package className="h-5 w-5" />
          <h3 className="text-lg font-semibold">{outlet.nama}</h3>
          <span
            className={`px-2 py-1 rounded-full text-xs ${
              outlet.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
            {outlet.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Kode:</span>{' '}
            <code className="bg-gray-100 px-2 py-1 rounded">{outlet.kode}</code>
          </div>
          <div>
            <span className="text-gray-500">Alamat:</span> {outlet.alamat || '-'}
          </div>
          <div>
            <span className="text-gray-500">No. HP:</span> {outlet.noHp || '-'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
