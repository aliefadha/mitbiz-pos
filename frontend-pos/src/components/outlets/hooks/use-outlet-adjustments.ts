import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';

export function useOutletAdjustments(outletId: string) {
  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ['stock-adjustments', { outletId }],
    queryFn: () => stockAdjustmentsApi.getAll({ outletId }),
    enabled: !!outletId,
  });

  const adjustments = useMemo(() => adjustmentsData?.data || [], [adjustmentsData]);

  return {
    adjustmentsLoading,
    adjustments,
  };
}
