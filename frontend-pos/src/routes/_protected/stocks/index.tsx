import { createFileRoute } from '@tanstack/react-router';
import { StockPage } from '@/components/stocks/stock-page';

export const Route = createFileRoute('/_protected/stocks/')({
  component: StockPage,
});
