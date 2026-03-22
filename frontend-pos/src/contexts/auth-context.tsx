import { useQuery } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react';
import { groupPermissions, type Permission, type PermissionItem } from '../lib/api/roles';
import { usersApi } from '../lib/api/users';
import { signOut as signOutAuth, useSession } from '../lib/auth-client';
import { clearCachedSession, clearPermissionsCache } from '../lib/session-cache';

export type UserScope = 'global' | 'tenant' | undefined;

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  roleId?: string;
  roleName?: string;
  roleScope?: UserScope;
  tenantId?: string;
  outletId?: string;
  isSubscribed?: boolean;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  scope: UserScope;
  roleId: string | undefined;
  permissions: Permission[];
  isPermissionsLoading: boolean;
  logout: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (resource: string, actions: string[]) => boolean;
  hasAnyResourcePermission: (
    checks: { resource: string; action?: string; actions?: string[] }[]
  ) => boolean;
  hasAllPermissions: (checks: { resource: string; actions: string[] }[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending: isSessionLoading } = useSession();

  const user = session?.user as User | null | undefined;
  const roleId = user?.roleId;

  // Fetch role permissions when user has a roleId
  const { data: rolePermissionsData, isLoading: isPermissionsLoading } = useQuery<
    PermissionItem[] | null
  >({
    queryKey: ['role-permissions', roleId],
    queryFn: async () => {
      if (!roleId) return null;
      const result = await usersApi.getMyRoleAndPermissions();
      return result.permissions ?? [];
    },
    enabled: !!roleId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const logout = useCallback(async () => {
    clearCachedSession();
    clearPermissionsCache();
    await signOutAuth();
  }, []);

  // Transform flat permissions to grouped format
  const permissions = useMemo(() => {
    if (!rolePermissionsData) return [];
    return groupPermissions(rolePermissionsData);
  }, [rolePermissionsData]);

  // Helper to check if user has specific permission
  const hasPermission = useCallback(
    (resource: string, action: string): boolean => {
      if (!permissions.length) return false;

      const permission = permissions.find(
        (p: Permission) =>
          p.resource.toLowerCase() === resource.toLowerCase() ||
          p.resource.toLowerCase() === resource.toLowerCase() + 's'
      );

      if (!permission) return false;
      return permission.actions.some((a: string) => a.toLowerCase() === action.toLowerCase());
    },
    [permissions]
  );

  // Helper to check if user has any of the specified permissions
  const hasAnyPermission = useCallback(
    (resource: string, actions: string[]): boolean => {
      return actions.some((action) => hasPermission(resource, action));
    },
    [hasPermission]
  );

  // Helper to check if user has any permission across multiple resources
  const hasAnyResourcePermission = useCallback(
    (checks: { resource: string; action?: string; actions?: string[] }[]): boolean => {
      return checks.some((check) => {
        const actionsToCheck = check.actions || (check.action ? [check.action] : []);
        return actionsToCheck.some((action) => hasPermission(check.resource, action));
      });
    },
    [hasPermission]
  );

  // Helper to check if user has all of the specified permissions
  const hasAllPermissions = useCallback(
    (checks: { resource: string; actions: string[] }[]): boolean => {
      return checks.every((check) => hasAnyPermission(check.resource, check.actions));
    },
    [hasAnyPermission]
  );

  // Extract scope from user.roleScope (provided by backend customSession)
  const scope = useMemo<UserScope>(() => {
    return user?.roleScope;
  }, [user?.roleScope]);

  const value: AuthContextType = {
    user: user ?? null,
    isLoading: isSessionLoading,
    isAuthenticated: !!session,
    scope,
    roleId,
    permissions,
    isPermissionsLoading,
    logout,
    hasPermission,
    hasAnyPermission,
    hasAnyResourcePermission,
    hasAllPermissions,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Convenience hooks for common use cases
export function usePermissions() {
  const {
    permissions,
    isPermissionsLoading,
    hasPermission,
    hasAnyPermission,
    hasAnyResourcePermission,
    hasAllPermissions,
  } = useAuth();
  return {
    permissions,
    isPermissionsLoading,
    hasPermission,
    hasAnyPermission,
    hasAnyResourcePermission,
    hasAllPermissions,
  };
}

export function useUser() {
  const { user, isLoading, isAuthenticated } = useAuth();
  return { user, isLoading, isAuthenticated };
}
