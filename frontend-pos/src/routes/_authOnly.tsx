import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { getSessionWithCache } from '@/lib/session-cache';

export const Route = createFileRoute('/_authOnly')({
  component: AuthOnlyLayout,
  beforeLoad: async () => {
    const session = await getSessionWithCache();
    if (!session) {
      throw redirect({ to: '/login' });
    }
    return { session };
  },
});

function AuthOnlyLayout() {
  return <Outlet />;
}
