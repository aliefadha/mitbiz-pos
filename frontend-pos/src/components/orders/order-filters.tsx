import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Outlet {
  id: string;
  nama: string;
}

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  outletFilter: string;
  onOutletChange: (outletId: string) => void;
  startDate: string;
  onStartDateChange: (date: string) => void;
  endDate: string;
  onEndDateChange: (date: string) => void;
  outlets?: Outlet[];
  canReadOutlets?: boolean;
}

export function OrderFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  outletFilter,
  onOutletChange,
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  outlets = [],
  canReadOutlets = false,
}: OrderFiltersProps) {
  const filterCount = 4 + (canReadOutlets ? 1 : 0);
  const gridCols = filterCount >= 5 ? 5 : filterCount;

  return (
    <div
      className={`grid grid-cols-1 md:grid-cols-${gridCols} lg:grid-cols-${gridCols} gap-4 mb-4`}
    >
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Cari pesanan..."
            value={searchQuery}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            className="pl-9 w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Input
          type="date"
          value={startDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onStartDateChange(e.target.value)}
          className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600"
        />
      </div>

      <div className="space-y-2">
        <Input
          type="date"
          value={endDate}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onEndDateChange(e.target.value)}
          className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600"
        />
      </div>

      {canReadOutlets && (
        <div className="space-y-2">
          <Select value={outletFilter} onValueChange={onOutletChange}>
            <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600">
              <SelectValue placeholder="Semua Outlet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Outlet</SelectItem>
              {outlets.map((outlet) => (
                <SelectItem key={outlet.id} value={outlet.id}>
                  {outlet.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <div className="space-y-2">
        <Select value={statusFilter} onValueChange={onStatusChange}>
          <SelectTrigger className="w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="complete">Selesai</SelectItem>
            <SelectItem value="cancel">Dibatalkan</SelectItem>
            <SelectItem value="refunded">Dikembalikan</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
