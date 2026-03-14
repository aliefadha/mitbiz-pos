import { createFileRoute } from '@tanstack/react-router';
import { UsersPage } from '@/components/users/users-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/(tenant)/users/')({
  component: UsersPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('users', 'read', 'tenant');
  },
});
