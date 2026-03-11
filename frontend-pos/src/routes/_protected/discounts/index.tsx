import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { DiscountList } from '@/components/discounts/discount-list';
import { CreateDiscountDialog, DeleteDiscountDialog } from '@/components/discounts/dialogs';
import { useDiscountsPage } from '@/components/discounts/hooks/use-discounts-page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-auth';

function DiscountPage() {
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('discounts', 'create');
  const canUpdate = hasPermission('discounts', 'update');
  const canDelete = hasPermission('discounts', 'delete');

  const {
    searchQuery,
    createModalOpen,
    setCreateModalOpen,
    editingDiscount,
    deleteModalOpen,
    setDeleteModalOpen,
    deletingDiscount,
    currentPage,
    pageSize,
    outlets,
    form,
    onSubmit,
    isLoading,
    displayedDiscounts,
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
  } = useDiscountsPage();

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
          <h4 className="text-lg font-semibold m-0">Diskon</h4>
          <p className="text-sm text-gray-500 m-0">Kelola semua diskon dalam sistem</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Diskon
          </Button>
        )}
      </div>

      <DiscountList
        displayedDiscounts={displayedDiscounts}
        isLoading={isLoading}
        canUpdate={canUpdate}
        canDelete={canDelete}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        searchQuery={searchQuery}
        outlets={outlets}
        onSearchChange={handleSearchChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <CreateDiscountDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        editingDiscount={editingDiscount}
        onSubmit={onSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        form={form}
        outlets={outlets}
      />

      <DeleteDiscountDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        discount={deletingDiscount}
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute('/_protected/discounts/')({
  component: DiscountPage,
});
