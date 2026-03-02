import { redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';

export type Role = 'admin' | 'owner' | 'cashier';

export const ROLE_PERMISSIONS: Record<Role, string[]> = {
  admin: [
    '/tenants',
    '/settings',
    '/account',
    '/dashboard',
    'product',
    '/inventory',
    '/outlets',
    '/categories',
    '/orders',
    '/discounts',
    '/pos',
    '/payment-methods',
    '/cash-shifts',
    '/laporan',
  ],
  owner: [
    '/tenants/new',
    '/account',
    '/categories',
    '/products',
    '/settings',
    '/dashboard',
    '/inventory',
    '/outlets',
    '/orders',
    '/pos',
    '/discounts',
    '/payment-methods',
    '/cash-shifts',
    '/laporan',
  ],
  cashier: [
    '/dashboard',
    '/inventory',
    '/categories',
    '/products',
    '/orders',
    '/pos',
    '/payment-methods',
    '/discounts',
    '/settings',
    '/cash-shifts',
    '/laporan',
  ],
};

export async function checkAuth() {
  const { data: session } = await authClient.getSession();
  if (!session) {
    throw redirect({ to: '/login' });
  }
  return session;
}

export async function getSession() {
  const { data: session } = await authClient.getSession();
  return session;
}

export async function checkRoleAccess(pathname: string) {
  const session = await checkAuth();
  const roleObj = session.user.roleId as unknown as { name: string } | null | undefined;
  const role = (roleObj?.name as Role) || 'cashier';
  const allowedRoutes = ROLE_PERMISSIONS[role];

  const hasAccess = allowedRoutes.some((route) => pathname.startsWith(route));

  if (!hasAccess) {
    throw redirect({ to: '/dashboard' });
  }

  return { session, role };
}
