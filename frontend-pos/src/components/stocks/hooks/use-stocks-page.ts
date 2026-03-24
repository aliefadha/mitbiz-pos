import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { outletsApi } from '@/lib/api/outlets';
import { productsApi } from '@/lib/api/products';
import { stocksApi } from '@/lib/api/stocks';
import { useSessionWithCache } from '@/lib/session-cache';

export function useStocksPage() {
  const { data: session } = useSessionWithCache();
  const tenantId = session?.user?.tenantId;
  const outletId = session?.user?.outletId;
  const hasOutletId = !!outletId;

  const [searchQuery, setSearchQuery] = useState('');
  const [productFilter, setProductFilter] = useState<string>('');
  const [outletFilter, setOutletFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const effectiveOutletId = hasOutletId ? outletId : outletFilter || undefined;

  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: [
      'stocks',
      tenantId,
      effectiveOutletId,
      productFilter,
      currentPage,
      pageSize,
      searchQuery,
    ],
    queryFn: () =>
      stocksApi.getAll({
        tenantId,
        productId: productFilter || undefined,
        outletId: effectiveOutletId,
        page: currentPage,
        limit: pageSize,
      }),
    enabled: !!tenantId,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => productsApi.getAll({ tenantId, limit: 100 }),
    enabled: !!tenantId,
  });

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const displayedStocks = searchQuery
    ? (stocksData?.data?.filter(
        (stock) =>
          stock.product?.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.product?.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
          stock.outlet?.nama.toLowerCase().includes(searchQuery.toLowerCase())
      ) ?? [])
    : (stocksData?.data ?? []);
  const products = productsData?.data ?? [];
  const outlets = outletsData?.data ?? [];
  const totalPages = stocksData?.meta?.totalPages ?? 0;
  const total = stocksData?.meta?.total ?? 0;

  const totalProduk = products.length;
  const stokMenipis = displayedStocks.filter((stock) => {
    const minStock = stock.product?.minStockLevel ?? 10;
    return stock.quantity > 0 && stock.quantity <= minStock;
  }).length;
  const stokHabis = displayedStocks.filter((stock) => stock.quantity === 0).length;

  const getStockStatusColor = (quantity: number, minStockLevel?: number) => {
    const minStock = minStockLevel ?? 10;
    if (quantity === 0) return 'bg-red-100 text-red-700';
    if (quantity <= minStock) return 'bg-yellow-100 text-yellow-700';
    return 'bg-blue-500 text-white';
  };

  const getStockStatusText = (quantity: number, minStockLevel?: number) => {
    const minStock = minStockLevel ?? 10;
    if (quantity === 0) return 'Habis';
    if (quantity <= minStock) return 'Menipis';
    return 'Tersedia';
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleProductFilterChange = (value: string) => {
    setProductFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handleOutletFilterChange = (value: string) => {
    setOutletFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  return {
    searchQuery,
    productFilter,
    outletFilter,
    currentPage,
    pageSize,
    tenantId,
    outletId,
    hasOutletId,

    stocksLoading,
    displayedStocks,
    products,
    outlets,
    totalProduk,
    stokMenipis,
    stokHabis,
    totalPages,
    total,

    getStockStatusColor,
    getStockStatusText,

    handleSearchChange,
    handleProductFilterChange,
    handleOutletFilterChange,
    handlePageChange,
    handlePageSizeChange,
  };
}
