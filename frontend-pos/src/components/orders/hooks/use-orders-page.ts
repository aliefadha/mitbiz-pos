import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { ordersApi } from '@/lib/api/orders';
import { outletsApi } from '@/lib/api/outlets';
import { useSessionWithCache } from '@/lib/session-cache';

interface UseOrdersPageOptions {
  canReadOutlets: boolean;
}

export function useOrdersPage(options?: UseOrdersPageOptions) {
  const { data: session } = useSessionWithCache();
  const tenantId = session?.user?.tenantId;

  const canReadOutlets = options?.canReadOutlets ?? false;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [outletFilter, setOutletFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return {
      from: thirtyDaysAgo,
      to: now,
    };
  });

  const { data: outletsData, isLoading: outletsLoading } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId && canReadOutlets,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', tenantId, outletFilter, searchQuery, statusFilter, currentPage, pageSize],
    queryFn: () =>
      ordersApi.getAll({
        tenantId,
        outletId: outletFilter !== 'all' ? outletFilter : undefined,
        search: searchQuery || undefined,
        status:
          statusFilter !== 'all' ? (statusFilter as 'complete' | 'cancel' | 'refunded') : undefined,
        page: currentPage,
        limit: pageSize,
      }),
    enabled: !!tenantId,
  });

  const displayedOrders = ordersData?.data ?? [];
  const outlets = outletsData?.data ?? [];

  return {
    tenantId,

    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    outletFilter,
    setOutletFilter,
    dateRange,
    setDateRange,

    outlets,
    outletsLoading,
    canReadOutlets,

    orders: displayedOrders,
    ordersLoading,
    ordersMeta: ordersData?.meta,

    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
  };
}
