import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import type { Product } from '@/lib/api/products';
import { productsApi } from '@/lib/api/products';
import { type Stock, stocksApi } from '@/lib/api/stocks';

export interface ProductStockRow {
  product: Product;
  stock: Stock | null;
}

export function useOutletStocks(outletId: string) {
  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ['stocks', { outletId }],
    queryFn: () => stocksApi.getAll({ outletId }),
    enabled: !!outletId,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', 'outlet', outletId],
    queryFn: () => productsApi.getAll({ outletId }),
    enabled: !!outletId,
  });

  const stocks = useMemo(() => stocksData?.data || [], [stocksData]);
  const products = useMemo(() => productsData?.data || [], [productsData]);

  const stockByProductId = useMemo(() => {
    const map = new Map<string, Stock>();
    stocks.forEach((s) => map.set(s.productId, s));
    return map;
  }, [stocks]);

  const rows: ProductStockRow[] = useMemo(
    () =>
      products.map((product) => ({
        product,
        stock: stockByProductId.get(product.id) || null,
      })),
    [products, stockByProductId]
  );

  const totalWithStock = useMemo(() => rows.filter((r) => r.stock !== null).length, [rows]);

  return {
    stocksLoading,
    productsLoading,
    stocks,
    products,
    rows,
    totalWithStock,
    totalProducts: products.length,
  };
}
