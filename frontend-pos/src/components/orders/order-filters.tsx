import { Search } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { DateRangePicker } from '@/components/ui/date-range-picker';
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
  dateRange: DateRange | undefined;
  onDateRangeChange: (range: DateRange | undefined) => void;
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
  dateRange,
  onDateRangeChange,
  outlets = [],
  canReadOutlets = false,
}: OrderFiltersProps) {
  return (
    <div
      className={`grid grid-cols-1 ${canReadOutlets ? 'md:grid-cols-4' : 'md:grid-cols-3'} gap-4 items-center mb-4`}
    >
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari pesanan..."
          value={searchQuery}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
          className="pl-9 w-full bg-gray-50/50 border-gray-200 rounded-lg h-10 text-gray-600"
        />
      </div>

      <DateRangePicker date={dateRange} onDateChange={onDateRangeChange} />

      {canReadOutlets && (
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
      )}

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
  );
}
