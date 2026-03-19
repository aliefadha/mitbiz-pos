import { createFileRoute } from '@tanstack/react-router';
import { ReportsPage } from '@/components/reports/reports-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/(global)/reports/')({
  component: RouteComponent,
  beforeLoad: async () => {
    await checkPermissionWithScope('subscriptions', 'read', 'global');
  },
});

function RouteComponent() {
  return <ReportsPage />;
}
