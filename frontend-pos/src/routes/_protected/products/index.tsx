import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { ErrorPage } from '@/components/error-page';
import { ForbiddenPage } from '@/components/forbidden-page';
import { DeleteProductDialog } from '@/components/products/dialogs';
import { useProductsPage } from '@/components/products/hooks/use-products-page';
import { ProductList } from '@/components/products/product-list';
import { ProductStats } from '@/components/products/product-stats';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { usePermissions } from '@/hooks/use-auth';
import { checkPermission, ForbiddenError } from '@/lib/permissions';

function ProductPage() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  const canCreate = hasPermission('products', 'create');
  const canDelete = hasPermission('products', 'delete');

  const {
    searchQuery,
    categoryFilter,
    currentPage,
    pageSize,
    deleteModalOpen,
    setDeleteModalOpen,
    deletingProduct,
    productsLoading,
    displayedProducts,
    categories,
    totalProduk,
    produkAktif,
    totalPages,
    total,
    deleteMutation,
    handleSearchChange,
    handleCategoryChange,
    handlePageChange,
    handlePageSizeChange,
    handleDelete,
    confirmDelete,
  } = useProductsPage();

  const handleCreate = () => {
    navigate({ to: '/products/new' });
  };

  if (productsLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-1/3" />
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
          <h4 className="text-lg font-semibold m-0">Manajemen Produk</h4>
          <p className="text-sm text-gray-500 m-0">Kelola produk Anda</p>
        </div>
        {canCreate && (
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            Tambah Produk
          </Button>
        )}
      </div>

      <ProductStats totalProduk={totalProduk} produkAktif={produkAktif} />

      <ProductList
        displayedProducts={displayedProducts}
        isLoading={productsLoading}
        canDelete={canDelete}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        searchQuery={searchQuery}
        categoryFilter={categoryFilter}
        categories={categories}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
        onDelete={handleDelete}
      />

      <DeleteProductDialog
        open={deleteModalOpen}
        onOpenChange={setDeleteModalOpen}
        product={deletingProduct}
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}

export const Route = createFileRoute('/_protected/products/')({
  component: ProductPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('products', 'read');
    if (!allowed) {
      throw new ForbiddenError('products');
    }
  },
  errorComponent: ({ error }) => {
    if (error instanceof ForbiddenError) {
      return <ForbiddenPage resource={error.resource} />;
    }
    return <ErrorPage reset={() => window.location.reload()} />;
  },
});
