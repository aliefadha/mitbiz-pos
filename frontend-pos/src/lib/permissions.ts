import { redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import { getRolePermissions, groupPermissions } from './api/roles';

export interface PermissionCheck {
  resource: string;
  action: string;
}

/**
 * Check if user has specific permission
 * Use this in route beforeLoad to check permissions
 */
export async function checkPermission(
  resource: string,
  action: string
): Promise<{ allowed: boolean }> {
  const session = await authClient.getSession();

  if (!session.data) {
    throw redirect({ to: '/login' });
  }

  const roleId = (session.data.user as unknown as { roleId?: string })?.roleId;
  if (!roleId) {
    return { allowed: false };
  }

  const permissionsData = await getRolePermissions(roleId);
  const groupedPermissions = groupPermissions(permissionsData);

  const permission = groupedPermissions.find(
    (p) =>
      p.resource.toLowerCase() === resource.toLowerCase() ||
      p.resource.toLowerCase() === resource.toLowerCase() + 's'
  );

  if (!permission) {
    return { allowed: false };
  }

  const hasPermission = permission.actions.some((a) => a.toLowerCase() === action.toLowerCase());

  return { allowed: hasPermission };
}

/**
 * Check if user has any of the specified permissions
 */
export async function checkAnyPermission(checks: PermissionCheck[]): Promise<{ allowed: boolean }> {
  const session = await authClient.getSession();

  if (!session.data) {
    throw redirect({ to: '/login' });
  }

  const roleId = (session.data.user as unknown as { roleId?: string })?.roleId;
  if (!roleId) {
    return { allowed: false };
  }

  const permissionsData = await getRolePermissions(roleId);
  const groupedPermissions = groupPermissions(permissionsData);

  // Check if user has ANY of the specified permissions
  const hasAny = checks.some((check) => {
    const permission = groupedPermissions.find(
      (p) =>
        p.resource.toLowerCase() === check.resource.toLowerCase() ||
        p.resource.toLowerCase() === check.resource.toLowerCase() + 's'
    );
    return permission?.actions.some((a) => a.toLowerCase() === check.action.toLowerCase());
  });

  return { allowed: hasAny };
}

// Resource to route mapping for automatic permission checking
export const ROUTE_PERMISSIONS: Record<string, PermissionCheck> = {
  '/dashboard': { resource: 'dashboard', action: 'read' },
  '/laporan': { resource: 'report', action: 'read' },
  '/pos': { resource: 'orders', action: 'create' },
  '/orders': { resource: 'orders', action: 'read' },
  '/cash-shifts': { resource: 'cashShifts', action: 'read' },
  '/tenants': { resource: 'tenants', action: 'read' },
  '/outlets': { resource: 'outlets', action: 'read' },
  '/account': { resource: 'users', action: 'read' },
  '/categories': { resource: 'categories', action: 'read' },
  '/products': { resource: 'products', action: 'read' },
  '/discounts': { resource: 'discounts', action: 'read' },
  '/payment-methods': { resource: 'paymentMethods', action: 'read' },
  '/settings': { resource: 'settings', action: 'read' },
  '/inventory': { resource: 'stocks', action: 'read' },
};

export class ForbiddenError extends Error {
  resource: string;

  constructor(resource: string) {
    super(`Access denied for resource: ${resource}`);
    this.resource = resource;
    this.name = 'ForbiddenError';
  }
}
