import { useQuery } from '@tanstack/react-query';
import { ordersApi } from '@/lib/api/orders';

export function useOrderDetailPage(orderId: string) {
  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => ordersApi.getById(orderId),
    enabled: !!orderId,
  });

  return {
    orderId,
    order,
    isLoading,
  };
}
