import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { categoriesApi } from '@/lib/api/categories';
import { type Product, productsApi } from '@/lib/api/products';
import { useSessionWithCache } from '@/lib/session-cache';

export function useProductsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSessionWithCache();
  const tenantId = session?.user?.tenantId;

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', tenantId, searchQuery, categoryFilter, currentPage, pageSize],
    queryFn: () =>
      productsApi.getAll({
        tenantId,
        isActive: true,
        search: searchQuery || undefined,
        categoryId: categoryFilter || undefined,
        page: currentPage,
        limit: pageSize,
      }),
    enabled: !!tenantId,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories', tenantId],
    queryFn: () => categoriesApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const deleteMutation = useMutation({
    mutationFn: productsApi.delete,
    onSuccess: () => {
      toast.success('Produk berhasil dihapus');
      setDeleteModalOpen(false);
      setDeletingProduct(null);
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus produk');
    },
  });

  const displayedProducts = productsData?.data ?? [];
  const categories = categoriesData?.data ?? [];
  const totalProduk = productsData?.meta?.totalProduk ?? 0;
  const produkAktif = productsData?.meta?.produkAktif ?? 0;
  const totalPages = productsData?.meta?.totalPages ?? 0;
  const total = productsData?.meta?.total ?? 0;

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategoryFilter(value === 'all' ? '' : value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleDelete = (product: Product) => {
    setDeletingProduct(product);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deletingProduct) {
      deleteMutation.mutate(deletingProduct.id);
    }
  };

  return {
    searchQuery,
    categoryFilter,
    currentPage,
    pageSize,
    tenantId,

    deleteModalOpen,
    setDeleteModalOpen,
    deletingProduct,

    productsLoading,
    displayedProducts,
    categories,
    totalProduk,
    produkAktif,
    totalPages,
    total,

    deleteMutation,

    handleSearchChange,
    handleCategoryChange,
    handlePageChange,
    handlePageSizeChange,
    handleDelete,
    confirmDelete,
  };
}
