import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';

export function useCategoryProducts(categoryId: string, tenantId: string) {
  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'category', categoryId, tenantId],
    queryFn: () =>
      productsApi.getAll({
        tenantId,
        categoryId: categoryId,
      }),
    enabled: !!categoryId && !!tenantId,
  });

  const products = productsData?.data ?? [];

  return {
    products,
    productsLoading,
  };
}
