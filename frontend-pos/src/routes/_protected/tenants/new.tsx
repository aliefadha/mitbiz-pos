import { createFileRoute } from '@tanstack/react-router';
import { CreateTenantPage } from '@/components/tenants/create-tenant-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/tenants/new')({
  component: CreateTenantPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('tenants', 'create', 'global');
  },
});
