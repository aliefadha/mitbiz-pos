import { createFileRoute } from '@tanstack/react-router';
import { TenantsPage } from '@/components/tenants/tenants-page';

export const Route = createFileRoute('/_protected/tenants/')({
  component: TenantsPage,
});
