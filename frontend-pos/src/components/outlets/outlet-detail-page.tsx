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
        outletId={outletId}
        onAddStock={handleAddStock}
        onEditStock={handleEditStock}
        onDeleteStock={handleDeleteStock}
        onAdjustStock={handleAdjustStock}
        editForm={editForm}
        adjustForm={adjustForm}
        onEditSubmit={handleEditSubmit}
        onAdjustSubmit={handleAdjustSubmit}
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
