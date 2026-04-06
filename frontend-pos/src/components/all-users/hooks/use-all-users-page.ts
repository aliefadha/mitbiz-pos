import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { tenantsApi } from '@/lib/api/tenants';
import { useSession } from '@/lib/auth-client';

export function useAllUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: session } = useSession();
  const tenantId = session?.user?.tenantId;

  const { data: tenantsData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['tenants', currentPage, pageSize, tenantId],
    queryFn: () => tenantsApi.getAll({ page: currentPage, limit: pageSize }),
  });

  const stats = useMemo(() => {
    const totalBisnis = tenantsData?.length || 0;
    const totalUser = tenantsData?.reduce((sum, t) => sum + (t.usersCount || 0), 0) || 0;
    return { totalUser, totalBisnis };
  }, [tenantsData]);

  const filteredUsers = useMemo(() => {
    if (!tenantsData) return [];

    let users = tenantsData.map((tenant) => ({
      id: tenant.user?.id || tenant.id,
      name: tenant.user?.name || '-',
      email: tenant.user?.email || '-',
      emailVerified: true as const,
      image: tenant.user?.image || null,
      createdAt: tenant.user?.createdAt || new Date(),
      updatedAt: tenant.user?.createdAt || new Date(),
      tenantId: tenant.id,
      tenant: {
        id: tenant.id,
        nama: tenant.nama,
      },
      isActive: tenant.isActive,
    }));

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          u.tenant?.nama.toLowerCase().includes(query)
      );
    }

    return users;
  }, [tenantsData, searchQuery]);

  const totalUsers = tenantsData?.length || 0;
  const totalPages = 1;

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
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
    currentPage,
    pageSize,
    totalUsers,
    totalPages,
    isLoadingUsers,
    stats,
    filteredUsers,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
  };
}
