import { useQuery } from '@tanstack/react-query';
import { createContext, type ReactNode, useCallback, useContext, useMemo } from 'react';
import {
  getRolePermissions,
  groupPermissions,
  type Permission,
  type PermissionItem,
} from '../lib/api/roles';
import { signOut as signOutAuth, useSession } from '../lib/auth-client';

export type UserRole = string | undefined;

export interface User {
  id: string;
  email: string;
  name?: string;
  image?: string;
  roleId?: string;
  tenantId?: string;
  outletId?: string;
  isSubscribed?: boolean;
  emailVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  roles?: {
    id: string;
    name: string;
    scope: string;
  };
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: UserRole;
  roleId: string | undefined;
  permissions: Permission[];
  isPermissionsLoading: boolean;
  logout: () => Promise<void>;
  hasPermission: (resource: string, action: string) => boolean;
  hasAnyPermission: (resource: string, actions: string[]) => boolean;
  isRole: (...roles: UserRole[]) => boolean;
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
    queryFn: () => {
      if (!roleId) return null;
      return getRolePermissions(roleId);
    },
    enabled: !!roleId && !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

  const logout = useCallback(async () => {
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

  // Extract role name from first permission (they all have the same roleId)
  // Note: We don't have role name in the permissions API, so we'll need to get it from elsewhere
  // For now, we'll use a placeholder or fetch it separately
  const role = useMemo<UserRole>(() => {
    // Since the permissions API doesn't return role name, we'll need to either:
    // 1. Fetch role info separately
    // 2. Infer from available permissions
    // 3. Store it in user data
    // For now, return undefined - the role should come from user data or separate API
    return undefined;
  }, []);

  const value: AuthContextType = {
    user: user ?? null,
    isLoading: isSessionLoading,
    isAuthenticated: !!session,
    role,
    roleId,
    permissions,
    isPermissionsLoading,
    logout,
    hasPermission,
    hasAnyPermission,
    isRole: () => false, // Temporarily disabled until we have role info
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
  const { permissions, isPermissionsLoading, hasPermission, hasAnyPermission } = useAuth();
  return { permissions, isPermissionsLoading, hasPermission, hasAnyPermission };
}

export function useUser() {
  const { user, isLoading, isAuthenticated } = useAuth();
  return { user, isLoading, isAuthenticated };
}
