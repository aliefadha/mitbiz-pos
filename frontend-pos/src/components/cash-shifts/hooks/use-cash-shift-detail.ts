import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { type CashShift, cashShiftsApi } from '@/lib/api/cash-shifts';
import { type Order, ordersApi } from '@/lib/api/orders';

export interface CashShiftDetail extends CashShift {
  orders?: Order[];
}

export function useCashShiftDetail(cashShiftId: string) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: cashShiftData, isLoading: cashShiftLoading } = useQuery({
    queryKey: ['cash-shift', cashShiftId],
    queryFn: () => cashShiftsApi.getById(cashShiftId),
    enabled: !!cashShiftId,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', 'by-cash-shift', cashShiftId, currentPage, pageSize],
    queryFn: () => ordersApi.getAll({ cashShiftId, page: currentPage, limit: pageSize }),
    enabled: !!cashShiftId,
  });

  const cashShift = cashShiftData as CashShiftDetail | undefined;
  const orders = ordersData?.data ?? [];
  const ordersMeta = ordersData?.meta;

  // Separate unpaginated query just for the total sales sum — unaffected by current page
  const { data: allOrdersData } = useQuery({
    queryKey: ['orders', 'by-cash-shift', cashShiftId, 'all-total'],
    queryFn: () => ordersApi.getAll({ cashShiftId, limit: 9999 }),
    enabled: !!cashShiftId,
  });

  const totalPenjualan = (allOrdersData?.data ?? []).reduce(
    (sum, order) => sum + parseFloat(order.total),
    0
  );

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return {
    cashShiftId,
    cashShift,
    orders,
    ordersMeta,
    totalPenjualan,
    isLoading: cashShiftLoading,
    ordersLoading,
    currentPage,
    pageSize,
    handlePageChange,
    handlePageSizeChange,
  };
}
