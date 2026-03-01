import { type UserRole, useAuth } from '../contexts/auth-context';

export type { UserRole };

export function useRole() {
  const { role, roleId } = useAuth();
  return { role, roleId };
}

export function useHasRole(...allowedRoles: UserRole[]) {
  const { isRole } = useAuth();
  return isRole(...allowedRoles);
}
