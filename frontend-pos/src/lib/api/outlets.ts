import { fetchApi } from './client';

export interface Outlet {
  id: string;
  tenantId: string;
  nama: string;
  kode: string;
  alamat: string | null;
  noHp: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface OutletQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  tenantId?: string;
}

export const outletsApi = {
  getAll: async (
    params?: OutletQueryParams
  ): Promise<{
    data: Outlet[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const queryString = params
      ? '?' +
        Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${value}`)
          .join('&')
      : '';
    const response = await fetchApi<{
      data: Outlet[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(`/outlets${queryString}`);
    return response;
  },

  getById: async (id: string): Promise<Outlet> => {
    return fetchApi<Outlet>(`/outlets/${id}`);
  },

  create: async (data: {
    tenantId: string;
    nama: string;
    kode: string;
    alamat?: string;
    noHp?: string;
    isActive?: boolean;
  }): Promise<Outlet> => {
    return fetchApi<Outlet>('/outlets', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (
    id: string,
    data: {
      nama?: string;
      kode?: string;
      alamat?: string;
      noHp?: string;
      isActive?: boolean;
    }
  ): Promise<Outlet> => {
    return fetchApi<Outlet>(`/outlets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/outlets/${id}`, {
      method: 'DELETE',
    });
  },
};
