import { createFileRoute } from '@tanstack/react-router';
import { StockAdjustmentPage } from '@/components/stock-adjustments/stock-adjustment-page';

export const Route = createFileRoute('/_protected/stock-adjustment/')({
  component: StockAdjustmentPage,
});
