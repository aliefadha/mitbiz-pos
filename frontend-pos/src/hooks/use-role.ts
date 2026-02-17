import { useAuth } from '../contexts/auth-context';

export type Role = 'admin' | 'owner' | 'cashier';

export function useRole() {
  const { role } = useAuth();
  return role;
}

export function useHasRole(...allowedRoles: Role[]) {
  const role = useRole();
  return role ? allowedRoles.includes(role) : false;
}
