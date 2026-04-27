import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import {
  checkAnyPermission,
  checkPermission,
  getUserScope,
  type PermissionCheck,
} from '@/lib/permissions';

const TENANT_ROUTE_PRIORITY: PermissionCheck[] = [
  { resource: 'dashboard', action: 'read' },
  { resource: 'orders', action: 'read' },
  { resource: 'stocks', action: 'read' },
  { resource: 'products', action: 'read' },
  { resource: 'categories', action: 'read' },
  { resource: 'sales', action: 'read' },
];

const TENANT_ROUTE_MAP: Record<string, string> = {
  dashboard: '/dashboard',
  orders: '/pos',
  stocks: '/stocks',
  products: '/products',
  categories: '/categories',
  sales: '/laporan',
};

export const Route = createFileRoute('/')({
  component: () => null,
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session) {
      throw redirect({ to: '/login' });
    }

    const roleScope = await getUserScope();

    if (roleScope === 'global') {
      throw redirect({ to: '/admin' });
    }

    if (!session.user.tenantId) {
      throw redirect({ to: '/onboarding/create-tenant' });
    }

    const { allowed } = await checkAnyPermission(TENANT_ROUTE_PRIORITY);

    if (!allowed) {
      throw redirect({ to: '/403' });
    }

    for (const check of TENANT_ROUTE_PRIORITY) {
      const result = await checkPermission(check.resource, check.action!);
      if (result.allowed) {
        const route = TENANT_ROUTE_MAP[check.resource];
        if (route) {
          throw redirect({ to: route });
        }
      }
    }

    throw redirect({ to: '/403' });
  },
});
