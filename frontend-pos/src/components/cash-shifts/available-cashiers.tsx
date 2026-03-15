import { Power, UserCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { CashShift } from '@/lib/api/cash-shifts';
import type { User } from '@/lib/api/users';

interface CashierWithShift {
  user: User;
  shift: CashShift | null;
}

interface AvailableCashiersProps {
  users: User[];
  openShifts: CashShift[];
  isLoading: boolean;
  canCreate: boolean;
  canUpdate: boolean;
  onOpenShift: (userId: string) => void;
  onCloseShift?: (shift: CashShift) => void;
}

export function AvailableCashiers({
  users,
  openShifts,
  isLoading,
  canCreate,
  canUpdate,
  onOpenShift,
  onCloseShift,
}: AvailableCashiersProps) {
  const cashiersWithShift: CashierWithShift[] = users.map((user) => {
    const shift = openShifts.find((s) => s.cashierId === user.id) || null;
    return { user, shift };
  });

  if (isLoading) {
    return (
      <Card className="shadow-sm border-gray-200 mb-6">
        <CardHeader>
          <CardTitle className="text-base font-semibold text-gray-900">Kasir</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 rounded-xl" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (users.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-sm border-gray-200 mb-6">
      <CardHeader>
        <CardTitle className="text-base font-semibold text-gray-900">Kasir</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cashiersWithShift.map(({ user, shift }) => (
            <Card key={user.id} className="shadow-sm border-gray-200 p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gray-100">
                  <UserCircle className="h-6 w-6 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{user.name}</p>
                  <p className="text-xs text-gray-500 truncate">{user.outlet?.nama}</p>
                </div>
                {shift ? (
                  <Badge
                    variant="outline"
                    className="bg-green-50 text-green-700 border-green-200 text-xs font-medium shrink-0"
                  >
                    Shift Aktif
                  </Badge>
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-gray-50 text-gray-700 border-gray-200 text-xs font-medium shrink-0"
                  >
                    Tersedia
                  </Badge>
                )}
              </div>
              {!shift && canCreate && (
                <Button
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg"
                  onClick={() => onOpenShift(user.id)}
                >
                  <Power className="h-4 w-4 mr-2" />
                  Buka Shift
                </Button>
              )}
              {shift && canUpdate && onCloseShift && (
                <Button
                  className="w-full bg-red-500 hover:bg-red-600 text-white rounded-lg"
                  onClick={() => onCloseShift(shift)}
                >
                  <Power className="h-4 w-4 mr-2" />
                  Tutup Shift
                </Button>
              )}
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
