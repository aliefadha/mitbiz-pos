import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { type Outlet, outletsApi } from '@/lib/api/outlets';
import { useSessionWithCache } from '@/lib/session-cache';

const formSchema = z.object({
  nama: z.string().min(1, 'Nama outlet wajib diisi'),
  kode: z.string().min(1, 'Kode outlet wajib diisi'),
  alamat: z.string().optional(),
  noHp: z.string().optional(),
});

export type OutletFormValues = z.infer<typeof formSchema>;

export function useOutletsPage() {
  const queryClient = useQueryClient();
  const { data: session } = useSessionWithCache();
  const tenantId = session?.user?.tenantId;

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingOutlet, setDeletingOutlet] = useState<Outlet | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  const form = useForm<OutletFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nama: '',
      kode: '',
      alamat: '',
      noHp: '',
    },
  });

  const resetFormForCreate = () => {
    form.reset({
      nama: '',
      kode: '',
      alamat: '',
      noHp: '',
    });
  };

  const resetFormForEdit = (outlet: Outlet) => {
    form.reset({
      nama: outlet.nama,
      kode: outlet.kode,
      alamat: outlet.alamat || '',
      noHp: outlet.noHp || '',
    });
  };

  const { data, isLoading } = useQuery({
    queryKey: ['outlets', tenantId, currentPage, pageSize, searchQuery],
    queryFn: () =>
      outletsApi.getAll({
        tenantId,
        page: currentPage,
        limit: pageSize,
        search: searchQuery || undefined,
      }),
    enabled: !!tenantId,
  });

  const createMutation = useMutation({
    mutationFn: (data: {
      tenantId: string;
      nama: string;
      kode: string;
      alamat?: string;
      noHp?: string;
      isActive?: boolean;
    }) => outletsApi.create(data),
    onSuccess: () => {
      toast.success('Outlet berhasil dibuat');
      setCreateModalOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal membuat outlet');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: OutletFormValues }) =>
      outletsApi.update(id, data),
    onSuccess: () => {
      toast.success('Outlet berhasil diupdate');
      setCreateModalOpen(false);
      setEditingOutlet(null);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal mengupdate outlet');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => outletsApi.delete(id),
    onSuccess: () => {
      toast.success('Outlet berhasil dihapus');
      setDeleteModalOpen(false);
      setDeletingOutlet(null);
      queryClient.invalidateQueries({ queryKey: ['outlets'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus outlet');
    },
  });

  const allOutlets = useMemo(() => data?.data ?? [], [data]);
  const totalOutlets = data?.meta?.totalOutlet ?? 0;
  const outletAktif = totalOutlets;
  const totalPages = data?.meta?.totalPages ?? 0;
  const total = data?.meta?.total ?? 0;

  const displayedOutlets = useMemo(() => {
    return allOutlets;
  }, [allOutlets]);

  const handleCreate = () => {
    setEditingOutlet(null);
    resetFormForCreate();
    setCreateModalOpen(true);
  };

  const handleEdit = (outlet: Outlet) => {
    setEditingOutlet(outlet);
    resetFormForEdit(outlet);
    setCreateModalOpen(true);
  };

  const handleDelete = (outlet: Outlet) => {
    setDeletingOutlet(outlet);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deletingOutlet) {
      deleteMutation.mutate(deletingOutlet.id);
    }
  };

  const onSubmit = (values: OutletFormValues) => {
    if (editingOutlet) {
      updateMutation.mutate({
        id: editingOutlet.id,
        data: values,
      });
    } else {
      createMutation.mutate({
        ...values,
        tenantId: tenantId!,
      });
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
    editingOutlet,
    deleteModalOpen,
    setDeleteModalOpen,
    deletingOutlet,
    currentPage,
    pageSize,
    tenantId,

    form,
    onSubmit,

    isLoading,
    displayedOutlets,
    totalOutlets,
    outletAktif,
    totalPages,
    total,

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
