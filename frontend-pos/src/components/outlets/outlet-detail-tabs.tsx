import { History, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/use-auth';
import type { ProductStockRow } from './hooks/use-outlet-stocks';
import type { EditStockFormValues, AdjustStockFormValues } from './hooks/use-outlet-detail-page';
import { OutletStocksSection } from './outlet-stocks-section';
import { OutletAdjustmentsSection } from './outlet-adjustments-section';
import type { UseFormReturn } from 'react-hook-form';

interface OutletDetailTabsProps {
  outletId: string;
  onAddStock: (productId: string) => void;
  onEditStock: (row: ProductStockRow) => void;
  onDeleteStock: (stockId: string) => void;
  onAdjustStock: (row: ProductStockRow) => void;
  editForm: UseFormReturn<EditStockFormValues>;
  adjustForm: UseFormReturn<AdjustStockFormValues>;
  onEditSubmit: (values: EditStockFormValues) => void;
  onAdjustSubmit: (values: AdjustStockFormValues) => void;
}

export function OutletDetailTabs({
  outletId,
  onAddStock,
  onEditStock,
  onDeleteStock,
  onAdjustStock,
}: OutletDetailTabsProps) {
  const { hasPermission } = usePermissions();

  const canReadStock = hasPermission('stocks', 'read');
  const canReadAdjustments = hasPermission('stockAdjustments', 'read');

  const defaultValue = canReadStock ? 'stock' : canReadAdjustments ? 'adjustments' : 'stock';

  if (!canReadStock && !canReadAdjustments) {
    return <div></div>;
  }

  return (
    <Tabs defaultValue={defaultValue}>
      <TabsList>
        {canReadStock && (
          <TabsTrigger value="stock" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Daftar Produk & Stock
          </TabsTrigger>
        )}
        {canReadAdjustments && (
          <TabsTrigger value="adjustments" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Riwayat Adjustment
          </TabsTrigger>
        )}
      </TabsList>

      {canReadStock && (
        <TabsContent value="stock">
          <OutletStocksSection
            outletId={outletId}
            onAddStock={onAddStock}
            onEditStock={onEditStock}
            onDeleteStock={onDeleteStock}
            onAdjustStock={onAdjustStock}
          />
        </TabsContent>
      )}

      {canReadAdjustments && (
        <TabsContent value="adjustments">
          <OutletAdjustmentsSection outletId={outletId} />
        </TabsContent>
      )}
    </Tabs>
  );
}
