import { createFileRoute, redirect } from '@tanstack/react-router';
import { UsersPage } from '@/components/users/users-page';
import { checkPermission } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/users/')({
  component: UsersPage,
  beforeLoad: async () => {
    const { allowed } = await checkPermission('users', 'read');
    if (!allowed) {
      throw redirect({ to: '/403' });
    }
  },
});
