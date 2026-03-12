import { fetchApi } from './client';
import type { PermissionItem } from './roles';

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  role?: {
    id: string;
    name: string;
  };
  roleId?: string;
  outlet?: {
    id: string;
    nama: string;
  };
  outletId?: string | null;
};

export type UserRoleAndPermissions = {
  role: {
    id: string;
    name: string;
    scope: 'global' | 'tenant';
  } | null;
  permissions: PermissionItem[];
};

export type CreateUserDto = {
  name: string;
  email: string;
  password: string;
  roleId?: string;
  outletId?: string;
  tenantId?: string;
  isSubscribed?: boolean;
};

export type UpdateUserDto = {
  name?: string;
  email?: string;
  roleId?: string;
  outletId?: string | null;
};

async function getUsers(filters?: {
  tenantId?: string;
  outletId?: string;
  roleId?: string;
}): Promise<{ users: User[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.tenantId) params.append('tenantId', filters.tenantId);
  if (filters?.outletId) params.append('outletId', filters.outletId);
  if (filters?.roleId) params.append('roleId', filters.roleId);
  const query = params.toString();
  return fetchApi(`/users${query ? `?${query}` : ''}`);
}

async function getProfile(): Promise<User> {
  return fetchApi('/users/me');
}

async function getMyRoleAndPermissions(): Promise<UserRoleAndPermissions> {
  return fetchApi('/users/me/permissions');
}

async function createUser(data: CreateUserDto): Promise<User> {
  return fetchApi('/users', {
    method: 'POST',
    data,
  });
}

async function updateUser(id: string, data: UpdateUserDto): Promise<User> {
  return fetchApi(`/users/${id}`, {
    method: 'PATCH',
    data,
  });
}

async function deleteUser(id: string): Promise<void> {
  return fetchApi(`/users/${id}`, {
    method: 'DELETE',
  });
}

async function updateProfile(data: { name?: string; image?: string }): Promise<User> {
  return fetchApi('/users/me', {
    method: 'PATCH',
    data,
  });
}

export const usersApi = {
  getUsers,
  getProfile,
  getMyRoleAndPermissions,
  createUser,
  updateUser,
  deleteUser,
  updateProfile,
};
