import { createFileRoute } from '@tanstack/react-router';
import { AllUsersPage } from '@/components/all-users/all-users-page';

export const Route = createFileRoute('/_protected/(global)/all-users/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <AllUsersPage />;
}
