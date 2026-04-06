import { useQueryClient } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { useAllUsersPage } from '@/components/all-users/hooks/use-all-users-page';
import { UserList } from '@/components/all-users/user-list';
import { UserStats } from '@/components/all-users/user-stats';
import { Skeleton } from '@/components/ui/skeleton';
import { checkPermissionWithScope } from '@/lib/permissions';

function AllUsersPage() {
  const queryClient = useQueryClient();
  const {
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
  } = useAllUsersPage();

  const handleUserUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['tenants'] });
  };

  if (isLoadingUsers) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-72" />
          </div>
          <Skeleton className="h-10 w-36" />
        </div>
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Manajemen User</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola admin dan kasir di semua bisnis</p>
        </div>
      </div>

      <UserStats totalUser={stats.totalUser} totalBisnis={stats.totalBisnis} />

      <UserList
        users={filteredUsers}
        searchQuery={searchQuery}
        currentPage={currentPage}
        pageSize={pageSize}
        totalUsers={totalUsers}
        totalPages={totalPages}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}

export const Route = createFileRoute('/_protected/(global)/all-users/')({
  component: AllUsersPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('users', 'read', 'global');
  },
});
