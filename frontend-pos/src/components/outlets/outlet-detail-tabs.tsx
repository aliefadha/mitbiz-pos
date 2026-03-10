import { History, Package } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/hooks/use-auth';
import type { StockAdjustment } from '@/lib/api/stock-adjustments';
import { AdjustmentsTab } from './adjustments-tab';
import type { ProductStockRow } from './hooks/use-outlet-detail-page';
import { StockTab } from './stock-tab';

interface OutletDetailTabsProps {
  stockRows: ProductStockRow[];
  adjustments: StockAdjustment[];
  isLoadingStock: boolean;
  searchText: string;
  onSearchChange: (value: string) => void;
  totalWithStock: number;
  totalProducts: number;
  onAddStock: (productId: string) => void;
  onEditStock: (row: ProductStockRow) => void;
  onDeleteStock: (stockId: string) => void;
  onAdjustStock: (row: ProductStockRow) => void;
}

export function OutletDetailTabs({
  stockRows,
  adjustments,
  isLoadingStock,
  searchText,
  onSearchChange,
  totalWithStock,
  totalProducts,
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
          <StockTab
            rows={stockRows}
            isLoading={isLoadingStock}
            searchText={searchText}
            onSearchChange={onSearchChange}
            totalWithStock={totalWithStock}
            totalProducts={totalProducts}
            onAddStock={onAddStock}
            onEditStock={onEditStock}
            onDeleteStock={onDeleteStock}
            onAdjustStock={onAdjustStock}
          />
        </TabsContent>
      )}

      {canReadAdjustments && (
        <TabsContent value="adjustments">
          <AdjustmentsTab adjustments={adjustments} />
        </TabsContent>
      )}
    </Tabs>
  );
}
