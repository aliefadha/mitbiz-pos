import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { CreateOutletDialog, DeleteOutletDialog } from '@/components/outlets/dialogs';
import { useOutletsPage } from '@/components/outlets/hooks/use-outlets-page';
import { OutletList } from '@/components/outlets/outlet-list';
import { OutletStats } from '@/components/outlets/outlet-stats';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-auth';

export function OutletPage() {
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('outlets', 'create');
  const canUpdate = hasPermission('outlets', 'update');
  const canDelete = hasPermission('outlets', 'delete');

  const {
    searchQuery,
    createModalOpen,
    setCreateModalOpen,
    editingOutlet,
    deleteModalOpen,
    setDeleteModalOpen,
    deletingOutlet,
    currentPage,
    pageSize,
    form,
    onSubmit,
    isLoading,
    displayedOutlets,
    totalOutlets,
    outletAktif,
    outletNonaktif,
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
  } = useOutletsPage();

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-3 gap-4">
          <Skeleton className="h-24" />
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
          <h4 className="text-lg font-semibold m-0">Manajemen Outlet</h4>
          <p className="text-sm text-gray-500 m-0">Kelola outlet toko Anda</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Outlet
          </Button>
        )}
      </div>

      <OutletStats
        totalOutlets={totalOutlets}
        outletAktif={outletAktif}
        outletNonaktif={outletNonaktif}
      />

      <OutletList
        displayedOutlets={displayedOutlets}
        isLoading={isLoading}
        canUpdate={canUpdate}
        canDelete={canDelete}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreateOutletDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        editingOutlet={editingOutlet}
        onSubmit={onSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        form={form}
      />

      <DeleteOutletDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        outlet={deletingOutlet}
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute('/_protected/outlets/')({
  component: OutletPage,
});
