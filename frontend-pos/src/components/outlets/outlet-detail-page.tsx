import { useParams } from '@tanstack/react-router';
import { Skeleton } from '@/components/ui/skeleton';
import { AdjustStockDialog, EditStockDialog } from './dialogs';
import { useOutletDetailPage } from './hooks/use-outlet-detail-page';
import { OutletDetailTabs } from './outlet-detail-tabs';
import { OutletInfoCard } from './outlet-info-card';

export function OutletDetailPage() {
  const { outletId } = useParams({
    from: '/_protected/outlets/$outletId',
  });

  const {
    searchText,
    setSearchText,
    isEditModalOpen,
    setIsEditModalOpen,
    isAdjustModalOpen,
    setIsAdjustModalOpen,
    editingRow,
    adjustingRow,
    editForm,
    adjustForm,
    outlet,
    isLoading,
    stocksLoading,
    productsLoading,
    filteredRows,
    totalWithStock,
    totalProducts,
    adjustments,
    updateStockMutation,
    createAdjustmentMutation,
    handleAddStock,
    handleEditStock,
    handleDeleteStock,
    handleAdjustStock,
    handleEditSubmit,
    handleAdjustSubmit,
  } = useOutletDetailPage(outletId);

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    );
  }

  if (!outlet) {
    return <div>Outlet not found</div>;
  }

  return (
    <div>
      <OutletInfoCard outlet={outlet} />

      <OutletDetailTabs
        stockRows={filteredRows}
        adjustments={adjustments}
        isLoadingStock={stocksLoading || productsLoading}
        searchText={searchText}
        onSearchChange={setSearchText}
        totalWithStock={totalWithStock}
        totalProducts={totalProducts}
        onAddStock={handleAddStock}
        onEditStock={handleEditStock}
        onDeleteStock={handleDeleteStock}
        onAdjustStock={handleAdjustStock}
      />

      <EditStockDialog
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        productName={editingRow?.product.nama || ''}
        onSubmit={handleEditSubmit}
        isPending={updateStockMutation.isPending}
        form={editForm}
      />

      <AdjustStockDialog
        open={isAdjustModalOpen}
        onOpenChange={setIsAdjustModalOpen}
        productName={adjustingRow?.product.nama || ''}
        currentQuantity={adjustingRow?.stock?.quantity ?? 0}
        onSubmit={handleAdjustSubmit}
        isPending={createAdjustmentMutation.isPending}
        form={adjustForm}
      />
    </div>
  );
}
