import { createFileRoute, redirect } from '@tanstack/react-router';
import { CashShiftPage } from '@/components/cash-shifts/cash-shift-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/cash-shifts/')({
  component: CashShiftPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('cashShifts', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
