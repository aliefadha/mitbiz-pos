import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppLayout } from '@/components/app-layout';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({ to: '/login' });
    }
  },
});

function ProtectedLayout() {
  return <AppLayout />;
}
