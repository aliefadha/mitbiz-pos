import { redirect } from '@tanstack/react-router';
import { getRolePermissions, groupPermissions } from './api/roles';
import {
  getCachedPermissions,
  getCachedScope,
  getSessionWithCache,
  setCachedPermissions,
  setCachedScope,
} from './session-cache';

export type UserScope = 'global' | 'tenant' | undefined;

export interface PermissionCheck {
  resource: string;
  action?: string;
  actions?: string[];
}

export interface RoutePermissionConfig {
  resource: string;
  action: string;
  scope: UserScope;
}

/**
 * Check if user has specific permission
 * Use this in route beforeLoad to check permissions
 */
export async function checkPermission(
  resource: string,
  action: string
): Promise<{ allowed: boolean; scope?: UserScope }> {
  const session = await getSessionWithCache();

  if (!session) {
    throw redirect({ to: '/login' });
  }

  const roleId = (session.user as unknown as { roleId?: string })?.roleId;

  if (!roleId) {
    return { allowed: false, scope: undefined };
  }

  let groupedPermissions = getCachedPermissions(roleId);
  let scope = getCachedScope(roleId);

  if (!groupedPermissions || scope === undefined) {
    const { permissions: permissionsData, roleScope } = await getRolePermissions(roleId);
    groupedPermissions = groupPermissions(permissionsData);
    setCachedPermissions(roleId, groupedPermissions);
    setCachedScope(roleId, roleScope);
    scope = roleScope;
  }

  const permission = groupedPermissions.find(
    (p) =>
      p.resource.toLowerCase() === resource.toLowerCase() ||
      p.resource.toLowerCase() === resource.toLowerCase() + 's'
  );

  if (!permission) {
    return { allowed: false, scope: scope as UserScope };
  }

  const hasPermission = permission.actions.some((a) => a.toLowerCase() === action.toLowerCase());

  return { allowed: hasPermission, scope: scope as UserScope };
}

/**
 * Check if user has any of the specified permissions
 */
export async function checkAnyPermission(
  checks: PermissionCheck[]
): Promise<{ allowed: boolean; scope?: UserScope }> {
  const session = await getSessionWithCache();

  if (!session) {
    throw redirect({ to: '/login' });
  }

  const roleId = (session.user as unknown as { roleId?: string })?.roleId;

  if (!roleId) {
    return { allowed: false, scope: undefined };
  }

  let groupedPermissions = getCachedPermissions(roleId);
  let scope = getCachedScope(roleId);

  if (!groupedPermissions || scope === undefined) {
    const { permissions: permissionsData, roleScope } = await getRolePermissions(roleId);
    groupedPermissions = groupPermissions(permissionsData);
    setCachedPermissions(roleId, groupedPermissions);
    setCachedScope(roleId, roleScope);
    scope = roleScope;
  }

  // Check if user has ANY of the specified permissions
  const hasAny = checks.some((check) => {
    const permission = groupedPermissions.find(
      (p) =>
        p.resource.toLowerCase() === check.resource.toLowerCase() ||
        p.resource.toLowerCase() === check.resource.toLowerCase() + 's'
    );

    if (!permission) return false;

    // Support both single action and multiple actions
    const actionsToCheck = check.actions || (check.action ? [check.action] : []);
    return actionsToCheck.some((action) =>
      permission.actions.some((a) => a.toLowerCase() === action.toLowerCase())
    );
  });

  return { allowed: hasAny, scope: scope as UserScope };
}
/**
 * Check if user has ALL of the specified permissions
 */
export async function checkAllPermissions(
  checks: PermissionCheck[]
): Promise<{ allowed: boolean; scope?: UserScope }> {
  const session = await getSessionWithCache();

  if (!session) {
    throw redirect({ to: '/login' });
  }

  const roleId = (session.user as unknown as { roleId?: string })?.roleId;

  if (!roleId) {
    return { allowed: false, scope: undefined };
  }

  let groupedPermissions = getCachedPermissions(roleId);
  let scope = getCachedScope(roleId);

  if (!groupedPermissions || scope === undefined) {
    const { permissions: permissionsData, roleScope } = await getRolePermissions(roleId);
    groupedPermissions = groupPermissions(permissionsData);
    setCachedPermissions(roleId, groupedPermissions);
    setCachedScope(roleId, roleScope);
    scope = roleScope;
  }

  // Check if user has ALL of the specified permissions
  const hasAll = checks.every((check) => {
    const permission = groupedPermissions.find(
      (p) =>
        p.resource.toLowerCase() === check.resource.toLowerCase() ||
        p.resource.toLowerCase() === check.resource.toLowerCase() + 's'
    );

    if (!permission) return false;

    // Support both single action and multiple actions
    // For checkAllPermissions, having ANY of the actions counts as having the permission
    const actionsToCheck = check.actions || (check.action ? [check.action] : []);
    return actionsToCheck.some((action) =>
      permission.actions.some((a) => a.toLowerCase() === action.toLowerCase())
    );
  });

  return { allowed: hasAll, scope: scope as UserScope };
}

/**
 * Check permission with optional scope requirement
 * If scope is required and user doesn't have it, redirects to 403
 */
export async function checkPermissionWithScope(
  resource: string,
  action: string,
  requiredScope: UserScope
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
 * Check any permission with optional scope requirement
 * Allows access if user has ANY of the specified permissions
 */
export async function checkAnyPermissionWithScope(
  checks: PermissionCheck[],
  requiredScope: UserScope
): Promise<{ allowed: boolean; scope: UserScope }> {
  const { allowed, scope } = await checkAnyPermission(checks);

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
  let scope: UserScope = 'global';
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

  if (!config.scope) {
    throw new Error(`Scope is required for route permission check: ${pathname}`);
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

/**
 * Get the current user's scope from cache or API.
 * Use this in route beforeLoad when you only need scope, not permissions.
 */
export async function getUserScope(): Promise<UserScope> {
  const session = await getSessionWithCache();
  if (!session) return undefined;

  const roleId = (session.user as unknown as { roleId?: string })?.roleId;
  if (!roleId) return undefined;

  let scope = getCachedScope(roleId);
  if (scope === undefined) {
    const { roleScope } = await getRolePermissions(roleId);
    setCachedScope(roleId, roleScope);
    scope = roleScope ?? undefined;
  }

  return scope as UserScope;
}
