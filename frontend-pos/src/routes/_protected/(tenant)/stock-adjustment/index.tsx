import { createFileRoute } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { ErrorPage } from '@/components/error-page';
import { ForbiddenPage } from '@/components/forbidden-page';
import { CreateAdjustmentDialog } from '@/components/stock-adjustments/dialogs';
import { useStockAdjustmentsPage } from '@/components/stock-adjustments/hooks';
import { StockAdjustmentList } from '@/components/stock-adjustments/stock-adjustment-list';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-auth';
import { checkAllPermissions, ForbiddenError } from '@/lib/permissions';

function StockAdjustmentPage() {
  const { hasPermission } = usePermissions();
  const canCreate = hasPermission('stockAdjustments', 'create');

  const {
    productFilter,
    outletFilter,
    currentPage,
    pageSize,
    isDialogOpen,
    selectedOutlet,
    selectedProduct,
    quantity,
    alasan,
    adjustmentsLoading,
    displayedAdjustments,
    outlets,
    products,
    totalPages,
    total,
    createMutation,
    getAdjustmentType,
    getAdjustmentTypeColor,
    handleProductFilterChange,
    handleOutletFilterChange,
    handlePageChange,
    handlePageSizeChange,
    handleSubmit,
    setSelectedOutlet,
    setSelectedProduct,
    setQuantity,
    setAlasan,
    openCreateDialog,
    closeCreateDialog,
  } = useStockAdjustmentsPage();

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="text-lg font-semibold m-0">Penyesuaian Stok</h4>
          <p className="text-sm text-gray-500 m-0">Tambah atau kurangi stok produk</p>
        </div>
        {canCreate && (
          <>
            <Button onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Penyesuaian
            </Button>
            <CreateAdjustmentDialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                if (!open) closeCreateDialog();
              }}
              outlets={outlets}
              products={products}
              selectedOutlet={selectedOutlet}
              selectedProduct={selectedProduct}
              quantity={quantity}
              alasan={alasan}
              isPending={createMutation.isPending}
              onOutletChange={setSelectedOutlet}
              onProductChange={setSelectedProduct}
              onQuantityChange={setQuantity}
              onAlasanChange={setAlasan}
              onSubmit={handleSubmit}
              onCancel={closeCreateDialog}
            />
          </>
        )}
      </div>

      <StockAdjustmentList
        displayedAdjustments={displayedAdjustments}
        isLoading={adjustmentsLoading}
        currentPage={currentPage}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
        productFilter={productFilter}
        outletFilter={outletFilter}
        products={products}
        outlets={outlets}
        getAdjustmentType={getAdjustmentType}
        getAdjustmentTypeColor={getAdjustmentTypeColor}
        onProductFilterChange={handleProductFilterChange}
        onOutletFilterChange={handleOutletFilterChange}
        onPageChange={handlePageChange}
        onPageSizeChange={handlePageSizeChange}
      />
    </div>
  );
}

export const Route = createFileRoute('/_protected/(tenant)/stock-adjustment/')({
  component: StockAdjustmentPage,
  beforeLoad: async () => {
    const { allowed } = await checkAllPermissions([
      { resource: 'stockAdjustments', action: 'read' },
      { resource: 'products', action: 'read' },
    ]);
    if (!allowed) {
      throw new ForbiddenError('stockAdjustments');
    }
  },
  errorComponent: ({ error }) => {
    if (error instanceof ForbiddenError) {
      return <ForbiddenPage resource={error.resource} />;
    }
    return <ErrorPage reset={() => window.location.reload()} />;
  },
});
