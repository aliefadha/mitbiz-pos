import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { outletsApi } from '@/lib/api/outlets';
import { type Product, productsApi } from '@/lib/api/products';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';
import { type Stock, stocksApi } from '@/lib/api/stocks';
import { useSession } from '@/lib/auth-client';

export interface ProductStockRow {
  product: Product;
  stock: Stock | null;
}

const editFormSchema = z.object({
  quantity: z.number(),
});

export type EditStockFormValues = z.infer<typeof editFormSchema>;

const adjustFormSchema = z.object({
  quantity: z.number(),
  alasan: z.string().optional(),
});

export type AdjustStockFormValues = z.infer<typeof adjustFormSchema>;

export function useOutletDetailPage(outletId: string) {
  const queryClient = useQueryClient();
  const { data: session } = useSession();
  const userId = session?.user?.id;

  const [searchText, setSearchText] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [editingRow, setEditingRow] = useState<ProductStockRow | null>(null);
  const [adjustingRow, setAdjustingRow] = useState<ProductStockRow | null>(null);

  const editForm = useForm<EditStockFormValues>({
    resolver: zodResolver(editFormSchema),
    defaultValues: { quantity: 0 },
  });

  const adjustForm = useForm<AdjustStockFormValues>({
    resolver: zodResolver(adjustFormSchema),
    defaultValues: { quantity: 0, alasan: '' },
  });

  const { data: outlet, isLoading: outletLoading } = useQuery({
    queryKey: ['outlet', outletId],
    queryFn: () => outletsApi.getById(outletId),
  });

  const { data: stocksData, isLoading: stocksLoading } = useQuery({
    queryKey: ['stocks', { outletId }],
    queryFn: () => stocksApi.getAll({ outletId }),
    enabled: !!outletId,
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products', outlet?.tenantId],
    queryFn: () => productsApi.getAll({ tenantId: outlet!.tenantId }),
    enabled: !!outlet?.tenantId,
  });

  const { data: adjustmentsData } = useQuery({
    queryKey: ['stock-adjustments', { outletId }],
    queryFn: () => stockAdjustmentsApi.getAll({ outletId }),
    enabled: !!outletId,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['stocks', { outletId }] });
    queryClient.invalidateQueries({ queryKey: ['stock-adjustments', { outletId }] });
  };

  const createStockMutation = useMutation({
    mutationFn: (data: { productId: string; outletId: string; quantity: number }) =>
      stocksApi.create(data),
    onSuccess: () => {
      toast.success('Stock berhasil ditambahkan');
      invalidateAll();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menambahkan stock');
    },
  });

  const updateStockMutation = useMutation({
    mutationFn: ({ stockId, quantity }: { stockId: string; quantity: number }) =>
      stocksApi.update(stockId, { quantity }),
    onSuccess: () => {
      toast.success('Stock berhasil diupdate');
      invalidateAll();
      setIsEditModalOpen(false);
      setEditingRow(null);
      editForm.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupdate stock');
    },
  });

  const deleteStockMutation = useMutation({
    mutationFn: (stockId: string) => stocksApi.delete(stockId),
    onSuccess: () => {
      toast.success('Stock berhasil dihapus');
      invalidateAll();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus stock');
    },
  });

  const createAdjustmentMutation = useMutation({
    mutationFn: (data: {
      productId: string;
      outletId: string;
      quantity: number;
      alasan?: string;
      adjustedBy: string;
    }) => stockAdjustmentsApi.create(data),
    onSuccess: () => {
      toast.success('Stock berhasil diadjust');
      invalidateAll();
      setIsAdjustModalOpen(false);
      setAdjustingRow(null);
      adjustForm.reset();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengadjust stock');
    },
  });

  const stocks = useMemo(() => stocksData?.data || [], [stocksData]);
  const products = useMemo(() => productsData?.data || [], [productsData]);
  const adjustments = useMemo(() => adjustmentsData?.data || [], [adjustmentsData]);

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

  const filteredRows = useMemo(() => {
    if (!searchText) return rows;
    const search = searchText.toLowerCase();
    return rows.filter(
      (row) =>
        row.product.nama.toLowerCase().includes(search) ||
        row.product.sku.toLowerCase().includes(search)
    );
  }, [rows, searchText]);

  const totalWithStock = useMemo(() => rows.filter((r) => r.stock !== null).length, [rows]);

  const handleAddStock = (productId: string) => {
    createStockMutation.mutate({ productId, outletId, quantity: 0 });
  };

  const handleEditStock = (row: ProductStockRow) => {
    setEditingRow(row);
    editForm.reset({ quantity: row.stock?.quantity || 0 });
    setIsEditModalOpen(true);
  };

  const handleDeleteStock = (stockId: string) => {
    deleteStockMutation.mutate(stockId);
  };

  const handleAdjustStock = (row: ProductStockRow) => {
    setAdjustingRow(row);
    adjustForm.reset({ quantity: 0, alasan: '' });
    setIsAdjustModalOpen(true);
  };

  const handleEditSubmit = (values: EditStockFormValues) => {
    if (editingRow?.stock) {
      updateStockMutation.mutate({
        stockId: editingRow.stock.id,
        quantity: values.quantity,
      });
    }
  };

  const handleAdjustSubmit = (values: AdjustStockFormValues) => {
    if (adjustingRow) {
      createAdjustmentMutation.mutate({
        productId: adjustingRow.product.id,
        outletId,
        quantity: values.quantity,
        alasan: values.alasan,
        adjustedBy: userId!,
      });
    }
  };

  const closeEditDialog = () => {
    setIsEditModalOpen(false);
    setEditingRow(null);
  };

  const closeAdjustDialog = () => {
    setIsAdjustModalOpen(false);
    setAdjustingRow(null);
  };

  const totalProducts = products.length;

  return {
    outletId,
    searchText,
    setSearchText,
    isEditModalOpen,
    setIsEditModalOpen,
    isAdjustModalOpen,
    setIsAdjustModalOpen,
    editingRow,
    adjustingRow,

    editForm,
    adjustForm,

    outlet,
    isLoading: outletLoading,
    stocksLoading,
    productsLoading,
    filteredRows,
    totalWithStock,
    totalProducts,
    products,
    adjustments,

    createStockMutation,
    updateStockMutation,
    deleteStockMutation,
    createAdjustmentMutation,

    handleAddStock,
    handleEditStock,
    handleDeleteStock,
    handleAdjustStock,
    handleEditSubmit,
    handleAdjustSubmit,
    handleUpdateStock: handleEditSubmit,
    handleCreateAdjustment: handleAdjustSubmit,
    closeEditDialog,
    closeAdjustDialog,
  };
}
