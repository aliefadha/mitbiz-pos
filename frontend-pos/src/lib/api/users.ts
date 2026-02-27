import { fetchApi } from './client';

export type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  createdAt: Date;
  updatedAt: Date;
  role?: 'admin' | 'owner' | 'cashier';
  outletId?: string | null;
};

export type CreateUserDto = {
  name: string;
  email: string;
  password: string;
  role?: 'admin' | 'owner' | 'cashier';
  outletId?: string;
  tenantId?: string;
  isSubscribed?: boolean;
};

async function getUsers(filters?: {
  tenantId?: string;
  outletId?: string;
}): Promise<{ users: User[]; total: number }> {
  const params = new URLSearchParams();
  if (filters?.tenantId) params.append('tenantId', filters.tenantId);
  if (filters?.outletId) params.append('outletId', filters.outletId);
  const query = params.toString();
  return fetchApi(`/users${query ? `?${query}` : ''}`);
}

async function getProfile(): Promise<User> {
  return fetchApi('/users/me');
}

async function createUser(data: CreateUserDto): Promise<User> {
  return fetchApi('/users', {
    method: 'POST',
    data,
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
  createUser,
  updateProfile,
};
