import { fetchApi } from './client';

export interface PermissionItem {
  id: string;
  roleId: string;
  resource: string;
  action: string;
  createdAt: string;
}

export interface Permission {
  resource: string;
  actions: string[];
}

export async function getRolePermissions(roleId: string): Promise<PermissionItem[]> {
  return fetchApi<PermissionItem[]>(`/roles/${roleId}/permissions`);
}

/**
 * Transform flat permissions array into grouped format
 */
export function groupPermissions(permissions: PermissionItem[]): Permission[] {
  const grouped = permissions.reduce((acc, perm) => {
    const existing = acc.find((p) => p.resource === perm.resource);
    if (existing) {
      existing.actions.push(perm.action);
    } else {
      acc.push({ resource: perm.resource, actions: [perm.action] });
    }
    return acc;
  }, [] as Permission[]);

  return grouped;
}
