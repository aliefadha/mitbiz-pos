import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { CategoryList } from '@/components/categories/category-list';
import { CategoryStats } from '@/components/categories/category-stats';
import { CreateCategoryDialog, DeleteCategoryDialog } from '@/components/categories/dialogs';
import { useCategoriesPage } from '@/components/categories/hooks/use-categories-page';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-auth';

export function CategoryPage() {
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('categories', 'create');
  const canUpdate = hasPermission('categories', 'update');
  const canDelete = hasPermission('categories', 'delete');

  const {
    searchQuery,
    createModalOpen,
    setCreateModalOpen,
    editingCategory,
    deleteModalOpen,
    setDeleteModalOpen,
    deletingCategory,
    currentPage,
    pageSize,
    form,
    onSubmit,
    isLoading,
    displayedCategories,
    totalCategories,
    categoryAktif,
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
  } = useCategoriesPage();

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
          <h4 className="text-lg font-semibold m-0">Manajemen Kategori</h4>
          <p className="text-sm text-gray-500 m-0">Kelola kategori produk</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Kategori
          </Button>
        )}
      </div>

      <CategoryStats totalCategories={totalCategories} categoryAktif={categoryAktif} />

      <CategoryList
        displayedCategories={displayedCategories}
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

      <CreateCategoryDialog
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        editingCategory={editingCategory}
        onSubmit={onSubmit}
        isPending={createMutation.isPending || updateMutation.isPending}
        form={form}
      />

      <DeleteCategoryDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        category={deletingCategory}
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/categories/')({
  component: CategoryPage,
});
