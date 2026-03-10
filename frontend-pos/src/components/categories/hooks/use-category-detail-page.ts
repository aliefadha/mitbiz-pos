import { useQuery } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api/categories';

export function useCategoryDetailPage(categoryId: string) {
  const { data: category, isLoading: categoryLoading } = useQuery({
    queryKey: ['category', categoryId],
    queryFn: () => categoriesApi.getById(categoryId),
    enabled: !!categoryId,
  });

  return {
    categoryId,
    category,
    isLoading: categoryLoading,
  };
}
