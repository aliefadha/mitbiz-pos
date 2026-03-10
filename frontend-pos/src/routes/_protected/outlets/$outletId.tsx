import { createFileRoute, useNavigate, useParams } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { AdjustStockDialog, EditStockDialog } from '@/components/outlets/dialogs';
import { useOutletDetailPage } from '@/components/outlets/hooks/use-outlet-detail-page';
import { OutletDetailTabs } from '@/components/outlets/outlet-detail-tabs';
import { OutletInfoCard } from '@/components/outlets/outlet-info-card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

export function OutletDetailPage() {
  const { outletId } = useParams({
    from: '/_protected/outlets/$outletId',
  });

  const navigate = useNavigate();

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
      <Button variant="link" onClick={() => navigate({ to: '/outlets' })} className="mb-4 pl-0">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Kembali ke outlet
      </Button>
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

export const Route = createFileRoute('/_protected/outlets/$outletId')({
  component: OutletDetailPage,
});
