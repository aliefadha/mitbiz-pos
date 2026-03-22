import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppLayout } from '@/components/app-layout';
import { getSessionWithCache } from '@/lib/session-cache';

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const session = await getSessionWithCache();
    if (!session) {
      throw redirect({ to: '/login' });
    }

    const { user } = session;

    if (user.roleScope === 'global') {
      return { session };
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      throw redirect({ to: '/onboarding/create-tenant' });
    }
    return { session };
  },
});

function ProtectedLayout() {
  return <AppLayout />;
}
