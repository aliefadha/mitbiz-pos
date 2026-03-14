import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/')({
  component: () => null,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    } else {
      if (session.user.roleScope === 'global') {
        throw redirect({ to: '/admin' });
      } else {
        throw redirect({ to: '/dashboard' });
      }
    }
  },
});
