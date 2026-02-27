import { fetchApi } from './client';

export interface Tax {
  id: string;
  tenantId: string;
  outletId: string | null;
  nama: string;
  rate: string;
  isGlobal: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenant?: {
    id: string;
    nama: string;
  };
}

export interface CreateTaxDto {
  tenantId: string;
  outletId?: string;
  nama: string;
  rate: string;
  isGlobal?: boolean;
  isActive?: boolean;
}

export interface UpdateTaxDto {
  outletId?: string | null;
  nama?: string;
  rate?: string;
  isGlobal?: boolean;
  isActive?: boolean;
}

export const taxesApi = {
  getAll: async (filters?: {
    tenantId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: Tax[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters?.tenantId) params.append('tenantId', filters.tenantId.toString());
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString();
    return fetchApi<{ data: Tax[]; meta: any }>(`/taxes${query ? `?${query}` : ''}`);
  },

  getActiveForOutlet: async (
    tenantId: string,
    outletId: string
  ): Promise<{ data: Tax[]; meta: any }> => {
    return fetchApi<{ data: Tax[]; meta: any }>(
      `/taxes/active-for-outlet?tenantId=${tenantId}&outletId=${outletId}`
    );
  },

  getById: async (id: string): Promise<Tax> => {
    return fetchApi<Tax>(`/taxes/${id}`);
  },

  create: async (data: CreateTaxDto): Promise<Tax> => {
    return fetchApi<Tax>('/taxes', {
      method: 'POST',
      data,
    });
  },

  update: async (id: string, data: UpdateTaxDto): Promise<Tax> => {
    return fetchApi<Tax>(`/taxes/${id}`, {
      method: 'PUT',
      data,
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchApi<void>(`/taxes/${id}`, {
      method: 'DELETE',
    });
  },
};
