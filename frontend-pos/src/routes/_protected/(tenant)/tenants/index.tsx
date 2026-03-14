import { createFileRoute } from '@tanstack/react-router';
import { TenantsPage } from '@/components/tenants/tenants-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/(tenant)/tenants/')({
  component: TenantsPage,
  beforeLoad: async () => {
    await checkPermissionWithScope('tenants', 'read', 'tenant');
  },
});
