import { createFileRoute } from '@tanstack/react-router';
import { CashShiftPage } from '@/components/cash-shifts/cash-shift-page';

export const Route = createFileRoute('/_protected/cash-shifts/')({
  component: CashShiftPage,
});
