import { Settings, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface UserStatsProps {
  totalUser: number;
  totalBisnis: number;
}

export function UserStats({ totalUser, totalBisnis }: UserStatsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Card className="py-5">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Total User</span>
            <Users className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <span className="text-3xl font-bold text-gray-900">{totalUser}</span>
          </div>
          <span className="text-xs text-gray-400">Dari semua role</span>
        </CardContent>
      </Card>

      <Card className="py-5">
        <CardContent className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Total Bisnis</span>
            <Settings className="h-4 w-4 text-gray-400" />
          </div>
          <div>
            <span className="text-3xl font-bold text-gray-900">{totalBisnis}</span>
          </div>
          <span className="text-xs text-gray-400">Tenant yang terdaftar</span>
        </CardContent>
      </Card>
    </div>
  );
}
