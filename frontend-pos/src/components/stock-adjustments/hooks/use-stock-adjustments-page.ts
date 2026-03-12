import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { outletsApi } from '@/lib/api/outlets';
import { productsApi } from '@/lib/api/products';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';
import { useSession } from '@/lib/auth-client';

export function useStockAdjustmentsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;
  const userId = session?.user?.id;

  const [productFilter, setProductFilter] = useState<string>('');
  const [outletFilter, setOutletFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('');
  const [alasan, setAlasan] = useState<string>('');

  const { data: adjustmentsData, isLoading: adjustmentsLoading } = useQuery({
    queryKey: ['stock-adjustments', tenantId, productFilter, outletFilter, currentPage, pageSize],
    queryFn: () =>
      stockAdjustmentsApi.getAll({
        productId: productFilter || undefined,
        outletId: outletFilter || undefined,
        page: currentPage,
        limit: pageSize,
      }),
    enabled: !!tenantId,
  });

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products', tenantId],
    queryFn: () => productsApi.getAll({ tenantId, limit: 100 }),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: stockAdjustmentsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-adjustments'] });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      alert(error.message || 'Failed to create stock adjustment');
    },
  });

  const resetForm = () => {
    setSelectedOutlet('');
    setSelectedProduct('');
    setQuantity('');
    setAlasan('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOutlet || !selectedProduct || !quantity || !userId) {
      alert('Mohon lengkapi semua field yang wajib diisi');
      return;
    }

    createMutation.mutate({
      outletId: selectedOutlet,
      productId: selectedProduct,
      quantity: parseInt(quantity, 10),
      alasan: alasan || undefined,
      adjustedBy: userId,
    });
  };

  const displayedAdjustments = adjustmentsData?.data ?? [];
  const outlets = (outletsData?.data ?? []).filter(
    (o, i, arr) => arr.findIndex((t) => t.id === o.id) === i
  );
  const products = (productsData?.data ?? []).filter(
    (p, i, arr) => arr.findIndex((t) => t.id === p.id) === i
  );

  const getAdjustmentType = (quantity: number) => {
    if (quantity > 0) return 'Tambah';
    if (quantity < 0) return 'Kurang';
    return '-';
  };

  const getAdjustmentTypeColor = (quantity: number) => {
    if (quantity > 0) return 'bg-green-100 text-green-700';
    if (quantity < 0) return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-700';
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

  const openCreateDialog = () => setIsDialogOpen(true);
  const closeCreateDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  return {
    productFilter,
    outletFilter,
    currentPage,
    pageSize,
    isDialogOpen,
    selectedOutlet,
    selectedProduct,
    quantity,
    alasan,
    adjustmentsLoading,
    displayedAdjustments,
    outlets,
    products,
    totalPages: adjustmentsData?.meta?.totalPages ?? 0,
    total: adjustmentsData?.meta?.total ?? 0,
    createMutation,
    getAdjustmentType,
    getAdjustmentTypeColor,
    handleProductFilterChange,
    handleOutletFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleSubmit,
    setSelectedOutlet,
    setSelectedProduct,
    setQuantity,
    setAlasan,
    openCreateDialog,
    closeCreateDialog,
  };
}
