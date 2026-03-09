import { redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';
import { getRolePermissions, groupPermissions } from './api/roles';

export type UserScope = 'global' | 'tenant' | undefined;

export interface PermissionCheck {
  resource: string;
  action: string;
}

export interface RoutePermissionConfig {
  resource: string;
  action: string;
  scope?: UserScope;
}

/**
 * Check if user has specific permission
 * Use this in route beforeLoad to check permissions
 */
export async function checkPermission(
  resource: string,
  action: string
): Promise<{ allowed: boolean; scope?: UserScope }> {
  const session = await authClient.getSession();

  if (!session.data) {
    throw redirect({ to: '/login' });
  }

  const roleId = (session.data.user as unknown as { roleId?: string })?.roleId;
  const scope = (session.data.user as unknown as { roles?: { scope: UserScope } })?.roles?.scope;

  if (!roleId) {
    return { allowed: false, scope };
  }

  const permissionsData = await getRolePermissions(roleId);
  const groupedPermissions = groupPermissions(permissionsData);

  const permission = groupedPermissions.find(
    (p) =>
      p.resource.toLowerCase() === resource.toLowerCase() ||
      p.resource.toLowerCase() === resource.toLowerCase() + 's'
  );

  if (!permission) {
    return { allowed: false, scope };
  }

  const hasPermission = permission.actions.some((a) => a.toLowerCase() === action.toLowerCase());

  return { allowed: hasPermission, scope };
}

/**
 * Check if user has any of the specified permissions
 */
export async function checkAnyPermission(
  checks: PermissionCheck[]
): Promise<{ allowed: boolean; scope?: UserScope }> {
  const session = await authClient.getSession();

  if (!session.data) {
    throw redirect({ to: '/login' });
  }

  const roleId = (session.data.user as unknown as { roleId?: string })?.roleId;
  const scope = (session.data.user as unknown as { roles?: { scope: UserScope } })?.roles?.scope;

  if (!roleId) {
    return { allowed: false, scope };
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

  return { allowed: hasAny, scope };
}

/**
 * Check permission with optional scope requirement
 * If scope is required and user doesn't have it, redirects to 403
 */
export async function checkPermissionWithScope(
  resource: string,
  action: string,
  requiredScope?: UserScope
): Promise<{ allowed: boolean; scope: UserScope }> {
  const { allowed, scope } = await checkPermission(resource, action);

  if (!allowed) {
    throw redirect({ to: '/403' });
  }

  if (requiredScope && scope !== requiredScope) {
    throw redirect({ to: '/403' });
  }

  return { allowed: true, scope };
}

/**
 * Get required permission for a route path
 * Maps route patterns to required permissions based on:
 * - Base path determines resource
 * - Suffix determines action (/new = create, /$id = read+update, etc.)
 */
export function getRoutePermission(pathname: string): RoutePermissionConfig | null {
  // Remove any leading/trailing slashes for consistency
  const path = pathname.replace(/^\/+|\/+$/g, '');
  const segments = path.split('/');

  // Map base paths to resources
  const resourceMap: Record<string, string> = {
    dashboard: 'dashboard',
    laporan: 'report',
    pos: 'orders',
    orders: 'orders',
    'cash-shifts': 'cashShifts',
    tenants: 'tenants',
    outlets: 'outlets',
    users: 'users',
    categories: 'categories',
    products: 'products',
    discounts: 'discounts',
    'payment-methods': 'paymentMethods',
    settings: 'settings',
    inventory: 'stocks',
    stocks: 'stocks',
    'stock-adjustment': 'stockAdjustments',
    account: 'users',
  };

  const baseSegment = segments[0];
  const resource = resourceMap[baseSegment];

  if (!resource) {
    return null;
  }

  // Determine action based on path pattern
  let action = 'read';

  // Check for /new suffix
  if (segments.includes('new')) {
    action = 'create';
  }
  // Check for edit patterns (e.g., /products/123/edit)
  else if (segments.includes('edit')) {
    action = 'update';
  }
  // Check for dynamic ID patterns (e.g., /products/123)
  // These require both read and update permissions
  else if (segments.length > 1 && segments[1] && !segments[1].includes('new')) {
    // For single item view/edit, we check read permission here
    // The component can do additional update permission check
    action = 'read';
  }

  // Determine scope requirement
  let scope: UserScope;
  if (baseSegment === 'tenants') {
    scope = 'global';
  }

  return { resource, action, scope };
}

/**
 * Check route permission - convenience function for route beforeLoad
 * Automatically determines required permission from pathname and checks it
 */
export async function checkRoutePermission(pathname: string): Promise<{ allowed: boolean }> {
  const config = getRoutePermission(pathname);

  if (!config) {
    // No specific permission required for this route
    return { allowed: true };
  }

  await checkPermissionWithScope(config.resource, config.action, config.scope);
  return { allowed: true };
}

// Legacy: Resource to route mapping (kept for backwards compatibility)
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
