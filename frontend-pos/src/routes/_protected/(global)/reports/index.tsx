import { createFileRoute } from '@tanstack/react-router';
import { ReportsPage } from '@/components/reports/reports-page';

export const Route = createFileRoute('/_protected/(global)/reports/')({
  component: RouteComponent,
});

function RouteComponent() {
  return <ReportsPage />;
}
