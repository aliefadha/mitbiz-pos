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

export interface Role {
  id: string;
  name: string;
  scope: 'global' | 'tenant';
  tenantId?: string;
  description?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  userCount?: number;
}

export interface CreateRoleDto {
  name: string;
  scope: 'global' | 'tenant';
  tenantId?: string;
  description?: string;
  isDefault?: boolean;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface Resource {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
}

export interface SetPermissionsDto {
  permissions: { resource: string; action: string }[];
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

/**
 * Complete Roles API
 */
export const rolesApi = {
  getAll: async (params?: { tenantId?: string; scope?: string }): Promise<Role[]> => {
    const queryParams = new URLSearchParams();
    if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
    if (params?.scope) queryParams.append('scope', params.scope);
    const query = queryParams.toString();
    return fetchApi<Role[]>(`/roles${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<Role> => {
    return fetchApi<Role>(`/roles/${id}`);
  },

  create: async (data: CreateRoleDto): Promise<Role> => {
    return fetchApi<Role>('/roles', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: UpdateRoleDto): Promise<Role> => {
    return fetchApi<Role>(`/roles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchApi<void>(`/roles/${id}`, {
      method: 'DELETE',
    });
  },

  getResources: async (): Promise<Resource[]> => {
    return fetchApi<Resource[]>('/roles/resources');
  },

  setPermissions: async (roleId: string, data: SetPermissionsDto): Promise<PermissionItem[]> => {
    return fetchApi<PermissionItem[]>(`/roles/${roleId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
};
