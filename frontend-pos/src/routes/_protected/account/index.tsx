import { createFileRoute, redirect } from '@tanstack/react-router';
import { AccountPage } from '@/components/account/account-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/account/')({
  component: AccountPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('users', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
