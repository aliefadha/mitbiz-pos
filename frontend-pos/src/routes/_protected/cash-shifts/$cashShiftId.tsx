import { createFileRoute, redirect } from '@tanstack/react-router';
import { CashShiftDetailPage } from '@/components/cash-shifts/cash-shift-detail-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/cash-shifts/$cashShiftId')({
  component: CashShiftDetailPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('cashShifts', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
