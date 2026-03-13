import { useQuery } from '@tanstack/react-query';
import { type CashShift, cashShiftsApi } from '@/lib/api/cash-shifts';
import { type Order, ordersApi } from '@/lib/api/orders';

export interface CashShiftDetail extends CashShift {
  orders?: Order[];
}

export function useCashShiftDetail(cashShiftId: string) {
  const { data: cashShiftData, isLoading: cashShiftLoading } = useQuery({
    queryKey: ['cash-shift', cashShiftId],
    queryFn: () => cashShiftsApi.getById(cashShiftId),
    enabled: !!cashShiftId,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'by-cash-shift', cashShiftId],
    queryFn: () => ordersApi.getAll({ cashShiftId }),
    enabled: !!cashShiftId,
  });

  const cashShift = cashShiftData as CashShiftDetail | undefined;
  const orders = ordersData?.data ?? [];

  const totalPenjualan = orders.reduce((sum, order) => sum + parseFloat(order.total), 0);

  return {
    cashShiftId,
    cashShift,
    orders,
    totalPenjualan,
    isLoading: cashShiftLoading,
    ordersLoading,
  };
}
