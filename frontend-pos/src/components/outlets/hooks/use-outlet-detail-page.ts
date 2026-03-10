import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { outletsApi } from '@/lib/api/outlets';
import { stockAdjustmentsApi } from '@/lib/api/stock-adjustments';
import { stocksApi } from '@/lib/api/stocks';
import { useSession } from '@/lib/auth-client';
import type { ProductStockRow } from './use-outlet-stocks';

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

  return {
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
  };
}
