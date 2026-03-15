import { createFileRoute } from '@tanstack/react-router';
import { SubscriptionsPage } from '@/components/subscriptions/subscriptions-page';

export const Route = createFileRoute('/_protected/(global)/subscriptions/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <SubscriptionsPage />;
}
