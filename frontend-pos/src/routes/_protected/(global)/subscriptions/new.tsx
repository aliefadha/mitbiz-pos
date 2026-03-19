import { createFileRoute } from '@tanstack/react-router';
import { CreatePlanPage } from '@/components/subscriptions/create-plan-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/(global)/subscriptions/new')({
  component: RouteComponent,
  beforeLoad: async () => {
    await checkPermissionWithScope('subscription_plans', 'create', 'global');
  },
});

function RouteComponent() {
  return <CreatePlanPage />;
}
