import { createFileRoute } from '@tanstack/react-router';
import { TenantUsersPage } from '@/components/tenants/tenant-users-page';

export const Route = createFileRoute('/_protected/tenants/$slug/users/')({
  component: TenantUsersPage,
});
