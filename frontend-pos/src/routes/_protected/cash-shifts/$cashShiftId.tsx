import { createFileRoute } from '@tanstack/react-router';
import { CashShiftDetailPage } from '@/components/cash-shifts/cash-shift-detail-page';

export const Route = createFileRoute('/_protected/cash-shifts/$cashShiftId')({
  component: CashShiftDetailPage,
});
