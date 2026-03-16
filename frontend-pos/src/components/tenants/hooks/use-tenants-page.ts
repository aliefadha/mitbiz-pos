import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'sonner';
import { type Tenant, type TenantQueryParams, tenantsApi } from '@/lib/api/tenants';

export function useTenantsPage() {
  const queryClient = useQueryClient();

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);

  const params: TenantQueryParams = {
    page: currentPage,
    limit: pageSize,
  };

  const { data: tenants = [], isLoading: tenantsLoading } = useQuery({
    queryKey: ['tenants', currentPage, pageSize],
    queryFn: () => tenantsApi.getAll(params),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => tenantsApi.delete(id),
    onSuccess: () => {
      toast.success('Bisnis berhasil dihapus');
      setDeleteModalOpen(false);
      setDeletingTenant(null);
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Gagal menghapus bisnis');
    },
  });

  const displayedTenants = tenants;
  const total = tenants.length;
  const totalPages = Math.ceil(total / pageSize) || 1;

  const tenantsAktif = displayedTenants.filter((t: Tenant) => t.isActive).length;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const handleDelete = (tenant: Tenant) => {
    setDeletingTenant(tenant);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (deletingTenant) {
      deleteMutation.mutate(deletingTenant.id);
    }
  };

  return {
    currentPage,
    pageSize,

    deleteModalOpen,
    setDeleteModalOpen,
    deletingTenant,

    tenantsLoading,
    displayedTenants,
    total,
    totalPages,
    tenantsAktif,

    deleteMutation,

    handlePageChange,
    handlePageSizeChange,
    handleDelete,
    confirmDelete,
  };
}
