import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  type CreateDiscountDto,
  type Discount,
  discountsApi,
  type UpdateDiscountDto,
} from '@/lib/api/discounts';
import { outletsApi } from '@/lib/api/outlets';
import { useSessionWithCache } from '@/lib/session-cache';

const formSchema = z.object({
  nama: z.string().min(1, 'Nama diskon wajib diisi'),
  rate: z.string().min(1, 'Tarif diskon wajib diisi'),
  scope: z.enum(['product', 'transaction']),
  level: z.enum(['tenant', 'outlet']),
  outletId: z.string().optional(),
});

export type DiscountFormValues = z.infer<typeof formSchema>;

export function useDiscountsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSessionWithCache();
  const tenantId = session?.user?.tenantId;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDiscount, setDeletingDiscount] = useState<Discount | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<DiscountFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      rate: '',
      scope: 'transaction',
      level: 'tenant',
    },
  });

  const resetFormForCreate = () => {
    form.reset({
      nama: '',
      rate: '',
      scope: 'transaction',
      level: 'tenant',
      outletId: undefined,
    });
  };

  const resetFormForEdit = (discount: Discount) => {
    form.reset({
      nama: discount.nama,
      rate: discount.rate,
      scope: discount.scope,
      level: discount.level,
      outletId: discount.outletId || undefined,
    });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['discounts', tenantId],
    queryFn: () => discountsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const { data: outletsData } = useQuery({
    queryKey: ['outlets', tenantId],
    queryFn: () => outletsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const outlets = outletsData?.data ?? [];

  const createMutation = useMutation({
    mutationFn: (data: CreateDiscountDto) => discountsApi.create(data),
    onSuccess: () => {
      toast.success('Diskon berhasil dibuat');
      setCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat diskon');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDiscountDto }) =>
      discountsApi.update(id, data),
    onSuccess: () => {
      toast.success('Diskon berhasil diupdate');
      setCreateModalOpen(false);
      setEditingDiscount(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupdate diskon');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: discountsApi.delete,
    onSuccess: () => {
      toast.success('Diskon berhasil dihapus');
      setDeleteModalOpen(false);
      setDeletingDiscount(null);
      queryClient.invalidateQueries({ queryKey: ['discounts'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus diskon');
    },
  });

  const allDiscounts = useMemo(() => data?.data ?? [], [data]);
  const filteredDiscounts = useMemo(
    () =>
      allDiscounts.filter(
        (discount) =>
          discount.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
          discount.rate.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [allDiscounts, searchQuery]
  );

  const totalFiltered = filteredDiscounts.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const displayedDiscounts = filteredDiscounts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCreate = () => {
    setEditingDiscount(null);
    resetFormForCreate();
    setCreateModalOpen(true);
  };

  const handleEdit = (discount: Discount) => {
    setEditingDiscount(discount);
    resetFormForEdit(discount);
    setCreateModalOpen(true);
  };

  const handleDelete = (discount: Discount) => {
    setDeletingDiscount(discount);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deletingDiscount) {
      deleteMutation.mutate(deletingDiscount.id);
    }
  };

  const onSubmit = (values: DiscountFormValues) => {
    const data = {
      nama: values.nama,
      rate: values.rate,
      scope: values.scope,
      level: values.level,
      outletId: values.level === 'outlet' ? values.outletId : null,
    };

    if (editingDiscount) {
      updateMutation.mutate({
        id: editingDiscount.id,
        data,
      });
    } else {
      createMutation.mutate({
        ...data,
        tenantId: tenantId!,
      } as CreateDiscountDto);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return {
    searchQuery,
    createModalOpen,
    setCreateModalOpen,
    editingDiscount,
    deleteModalOpen,
    setDeleteModalOpen,
    deletingDiscount,
    currentPage,
    pageSize,
    tenantId,
    outlets,

    form,
    onSubmit,

    isLoading,
    displayedDiscounts,
    totalPages,
    total: totalFiltered,

    createMutation,
    updateMutation,
    deleteMutation,

    handleCreate,
    handleEdit,
    handleDelete,
    confirmDelete,
    handlePageChange,
    handlePageSizeChange,
    handleSearchChange,
  };
}
