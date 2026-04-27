import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppLayout } from '@/components/app-layout';
import { tenantsApi } from '@/lib/api/tenants';
import { getUserScope } from '@/lib/permissions';
import { getSessionWithCache } from '@/lib/session-cache';

export const Route = createFileRoute('/_protected')({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const session = await getSessionWithCache();
    if (!session) {
      throw redirect({ to: '/login' });
    }

    const { user } = session;

    const roleScope = await getUserScope();

    if (roleScope === 'global') {
      return { session };
    }

    const tenantId = user.tenantId;
    if (!tenantId) {
      throw redirect({ to: '/onboarding/create-tenant' });
    }

    const tenant = await tenantsApi.getById(tenantId);
    const { subscription } = await tenantsApi.getSubscription(tenant.slug);

    if (!subscription || subscription.status !== 'active') {
      throw redirect({ to: '/subscription' });
    }

    return { session, subscription };
  },
});

function ProtectedLayout() {
  return <AppLayout />;
}
