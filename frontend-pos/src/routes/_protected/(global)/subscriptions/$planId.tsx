import { createFileRoute } from '@tanstack/react-router';
import { SubscriptionPlanDetailPage } from '@/components/subscriptions/subscription-plan-detail-page';
import { checkPermissionWithScope } from '@/lib/permissions';

export const Route = createFileRoute('/_protected/(global)/subscriptions/$planId')({
  component: RouteComponent,
  beforeLoad: async () => {
    await checkPermissionWithScope('subscription_plans', 'read', 'global');
  },
});

function RouteComponent() {
  return <SubscriptionPlanDetailPage />;
}
