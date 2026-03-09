import { createFileRoute, redirect } from '@tanstack/react-router';
import { PaymentMethodPage } from '@/components/payment-methods/payment-method-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/payment-methods/')({
  component: PaymentMethodPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('paymentMethods', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
