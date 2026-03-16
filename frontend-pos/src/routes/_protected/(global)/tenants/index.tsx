import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { DeleteTenantDialog } from '@/components/tenants/dialogs';
import { useTenantsPage } from '@/components/tenants/hooks/use-tenants-page';
import { TenantList } from '@/components/tenants/tenant-list';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-auth';
import { checkPermissionWithScope } from '@/lib/permissions';

function TenantsPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('tenants', 'create');
  const canDelete = hasPermission('tenants', 'delete');

  const {
    deleteModalOpen,
    setDeleteModalOpen,
    deletingTenant,
    tenantsLoading,
    displayedTenants,
    deleteMutation,
    handleDelete,
    confirmDelete,
  } = useTenantsPage();

  const handleCreate = () => {
    navigate({ to: '/tenants/new' });
  };

  if (tenantsLoading) {
    return (
      <div className="p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-semibold m-0">Manajemen Bisnis</h4>
          <p className="text-sm text-gray-500 m-0">Kelola semua bisnis yang terdaftar</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Bisnis
          </Button>
        )}
      </div>

      <TenantList
        displayedTenants={displayedTenants}
        isLoading={tenantsLoading}
        canDelete={canDelete}
        onDelete={handleDelete}
      />

      <DeleteTenantDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        tenant={deletingTenant}
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute('/_protected/(global)/tenants/')({
  component: TenantsPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('tenants', 'read', 'global');
  },
});
