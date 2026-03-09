import { createFileRoute } from '@tanstack/react-router';
import { TenantUsersPage } from '@/components/tenants/tenant-users-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/tenants/$slug/users/')({
  component: TenantUsersPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('users', 'read', 'global');
  },
});
