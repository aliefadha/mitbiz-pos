import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { ordersApi } from '@/lib/api/orders';
import { outletsApi } from '@/lib/api/outlets';
import { useSession } from '@/lib/auth-client';

interface UseOrdersPageOptions {
  canReadOutlets: boolean;
}

export function useOrdersPage(options?: UseOrdersPageOptions) {
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const canReadOutlets = options?.canReadOutlets ?? false;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [outletFilter, setOutletFilter] = useState<string>('all');

  const [startDate, setStartDate] = useState<string>(() => {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return thirtyDaysAgo.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: outletsData, isLoading: outletsLoading } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId && canReadOutlets,
  });

  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ['orders', tenantId, outletFilter, searchQuery, statusFilter],
    queryFn: () =>
      ordersApi.getAll({
        tenantId,
        outletId: outletFilter !== 'all' ? outletFilter : undefined,
        search: searchQuery || undefined,
        status:
          statusFilter !== 'all' ? (statusFilter as 'complete' | 'cancel' | 'refunded') : undefined,
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
    startDate,
    setStartDate,
    endDate,
    setEndDate,

    outlets,
    outletsLoading,
    canReadOutlets,

    orders: displayedOrders,
    ordersLoading,
    ordersMeta: ordersData?.meta,
  };
}
