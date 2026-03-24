import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  type CreatePaymentMethodDto,
  type PaymentMethod,
  paymentMethodsApi,
  type UpdatePaymentMethodDto,
} from '@/lib/api/payment-methods';
import { useSessionWithCache } from '@/lib/session-cache';

const formSchema = z.object({
  nama: z.string().min(1, 'Nama metode pembayaran wajib diisi'),
  isActive: z.boolean().optional(),
});

export type PaymentMethodFormValues = z.infer<typeof formSchema>;

export function usePaymentMethodsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSessionWithCache();
  const tenantId = session?.user?.tenantId;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingPaymentMethod, setEditingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPaymentMethod, setDeletingPaymentMethod] = useState<PaymentMethod | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<PaymentMethodFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      isActive: true,
    },
  });

  const resetFormForCreate = () => {
    form.reset({
      nama: '',
      isActive: true,
    });
  };

  const resetFormForEdit = (paymentMethod: PaymentMethod) => {
    form.reset({
      nama: paymentMethod.nama,
      isActive: paymentMethod.isActive,
    });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['payment-methods', tenantId],
    queryFn: () => paymentMethodsApi.getAll({ tenantId }),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: CreatePaymentMethodDto) => paymentMethodsApi.create(data),
    onSuccess: () => {
      toast.success('Metode pembayaran berhasil dibuat');
      setCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat metode pembayaran');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePaymentMethodDto }) =>
      paymentMethodsApi.update(id, data),
    onSuccess: () => {
      toast.success('Metode pembayaran berhasil diupdate');
      setCreateModalOpen(false);
      setEditingPaymentMethod(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupdate metode pembayaran');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: paymentMethodsApi.delete,
    onSuccess: () => {
      toast.success('Metode pembayaran berhasil dihapus');
      setDeleteModalOpen(false);
      setDeletingPaymentMethod(null);
      queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus metode pembayaran');
    },
  });

  const allPaymentMethods = useMemo(() => data?.data ?? [], [data]);
  const totalPaymentMethods = data?.data?.length ?? 0;
  const paymentMethodAktif = useMemo(
    () => data?.data?.filter((pm) => pm.isActive).length ?? 0,
    [data]
  );
  const paymentMethodNonaktif = useMemo(
    () => data?.data?.filter((pm) => !pm.isActive).length ?? 0,
    [data]
  );

  const filteredPaymentMethods = useMemo(
    () =>
      allPaymentMethods.filter((paymentMethod) =>
        paymentMethod.nama.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [allPaymentMethods, searchQuery]
  );

  const totalFiltered = filteredPaymentMethods.length;
  const totalPages = Math.ceil(totalFiltered / pageSize);
  const displayedPaymentMethods = filteredPaymentMethods.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleCreate = () => {
    setEditingPaymentMethod(null);
    resetFormForCreate();
    setCreateModalOpen(true);
  };

  const handleEdit = (paymentMethod: PaymentMethod) => {
    setEditingPaymentMethod(paymentMethod);
    resetFormForEdit(paymentMethod);
    setCreateModalOpen(true);
  };

  const handleDelete = (paymentMethod: PaymentMethod) => {
    setDeletingPaymentMethod(paymentMethod);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deletingPaymentMethod) {
      deleteMutation.mutate(deletingPaymentMethod.id);
    }
  };

  const onSubmit = (values: PaymentMethodFormValues) => {
    if (editingPaymentMethod) {
      updateMutation.mutate({
        id: editingPaymentMethod.id,
        data: values,
      });
    } else {
      createMutation.mutate({
        ...values,
        tenantId: tenantId!,
      } as CreatePaymentMethodDto);
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
    editingPaymentMethod,
    deleteModalOpen,
    setDeleteModalOpen,
    deletingPaymentMethod,
    currentPage,
    pageSize,
    tenantId,

    form,
    onSubmit,

    isLoading,
    displayedPaymentMethods,
    totalPaymentMethods,
    paymentMethodAktif,
    paymentMethodNonaktif,
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
