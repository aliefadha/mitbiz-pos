import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { tenantsApi } from '@/lib/api/tenants';
import { usersApi } from '@/lib/api/users';

export function useAllUsersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['users', currentPage, pageSize],
    queryFn: () => usersApi.getUsers({ page: currentPage, limit: pageSize }),
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants'],
    queryFn: () => tenantsApi.getAll(),
  });

  const stats = useMemo(() => {
    const totalUser = usersData?.meta?.total || 0;
    const totalBisnis = tenantsData?.length || 0;
    return { totalUser, totalBisnis };
  }, [usersData, tenantsData]);

  const filteredUsers = useMemo(() => {
    if (!usersData?.users) return [];
    let users = usersData.users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(
        (u) => u.name.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)
      );
    }

    if (selectedTenantFilter !== 'all') {
      users = users.filter((u) => u.tenantId === selectedTenantFilter);
    }

    return users;
  }, [usersData, searchQuery, selectedTenantFilter]);

  const totalUsers = usersData?.meta?.total || 0;
  const totalPages = usersData?.meta?.totalPages || 0;

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleTenantFilterChange = (value: string) => {
    setSelectedTenantFilter(value);
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
    selectedTenantFilter,
    currentPage,
    pageSize,
    totalUsers,
    totalPages,
    isLoadingUsers,
    usersData,
    tenantsData,
    stats,
    filteredUsers,
    handleSearchChange,
    handleTenantFilterChange,
    handlePageChange,
    handlePageSizeChange,
  };
}
