import { fetchApi } from './client';

export interface TenantSettings {
  currency: string;
  timezone: string;
  taxRate: number;
  receiptFooter?: string;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  outletId?: string | null;
  createdAt?: Date;
  role?: {
    name: string;
    scope: 'global' | 'tenant';
  } | null;
}

export interface Outlet {
  id: string;
  tenantId: string;
  nama: string;
  kode: string;
  alamat?: string;
  noHp?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface Tenant {
  id: string;
  nama: string;
  slug: string;
  userId: string;
  user?: User;
  usersCount?: number;
  outletsCount?: number;
  settings?: TenantSettings;
  image?: string;
  alamat?: string;
  noHp?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
  outlets?: Outlet[];
}

export interface TenantSummary {
  outletsCount: number;
  categoriesCount: number;
  productsCount: number;
  user: User | null;
}

export interface TenantQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  userId?: string;
}

interface FetchOptions extends RequestInit {
  userId?: string;
}

async function fetchApiWithUserId<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
  const { userId, ...fetchOptions } = options;
  const headers: HeadersInit = {
    ...(userId ? { 'x-user-id': userId } : {}),
    ...fetchOptions.headers,
  };

  return fetchApi<T>(endpoint, {
    ...fetchOptions,
    headers,
  });
}

export const tenantsApi = {
  getAll: async (params?: TenantQueryParams, userId?: string): Promise<Tenant[]> => {
    const allParams = { ...params, ...(userId ? { userId } : {}) };
    const queryString =
      Object.keys(allParams).length > 0
        ? '?' +
          Object.entries(allParams)
            .filter(([_, value]) => value !== undefined)
            .map(([key, value]) => `${key}=${value}`)
            .join('&')
        : '';
    const response = await fetchApi<{ data: Tenant[] }>(`/tenants${queryString}`);
    return response.data;
  },

  getMyTenants: async (): Promise<Tenant[]> => {
    const response = await fetchApi<{ data: Tenant[] }>('/users/me/tenants');
    return response.data;
  },

  getBySlug: async (slug: string): Promise<Tenant> => {
    return fetchApi<Tenant>(`/tenants/${slug}`);
  },

  getById: async (id: string): Promise<Tenant> => {
    return fetchApi<Tenant>(`/tenants/id/${id}`);
  },

  create: async (
    data: {
      nama: string;
      slug: string;
      userId: string;
      settings?: TenantSettings;
      image?: string;
      alamat?: string;
      noHp?: string;
      isActive?: boolean;
    },
    userId?: string
  ): Promise<Tenant> => {
    return fetchApiWithUserId<Tenant>('/tenants', {
      method: 'POST',
      body: JSON.stringify(data),
      userId,
    });
  },

  update: async (
    slug: string,
    data: Partial<{
      nama: string;
      slug: string;
      settings: TenantSettings;
      image: string;
      alamat: string;
      noHp: string;
      isActive: boolean;
    }>,
    userId?: string
  ): Promise<Tenant> => {
    return fetchApiWithUserId<Tenant>(`/tenants/${slug}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      userId,
    });
  },

  delete: async (slug: string, userId?: string): Promise<{ message: string }> => {
    return fetchApiWithUserId<{ message: string }>(`/tenants/${slug}`, {
      method: 'DELETE',
      userId,
    });
  },

  getUsers: async (slug: string): Promise<{ data: User[] }> => {
    return fetchApi<{ data: User[] }>(`/tenants/${slug}/users`);
  },

  getOutlets: async (slug: string): Promise<{ data: Outlet[] }> => {
    return fetchApi<{ data: Outlet[] }>(`/tenants/${slug}/outlets`);
  },

  getSummary: async (slug: string): Promise<TenantSummary> => {
    return fetchApi<TenantSummary>(`/tenants/${slug}/summary`);
  },
};
