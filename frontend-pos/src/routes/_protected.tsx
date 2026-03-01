import { createFileRoute } from '@tanstack/react-router';
import { AppLayout } from '@/components/app-layout';
import { ErrorPage } from '@/components/error-page';
import { checkRoleAccess } from '@/lib/rbac';

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
  beforeLoad: async ({ location }) => {
    await checkRoleAccess(location.pathname);
  },
  errorComponent: ({ reset }) => <ErrorPage reset={reset} />,
});

function ProtectedLayout() {
  return <AppLayout />;
}
