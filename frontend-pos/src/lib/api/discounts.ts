import { fetchApi } from './client';

export interface DiscountProduct {
  id: string;
  discountId: string;
  productId: string;
  product: {
    id: string;
    nama: string;
    sku: string;
  };
}

export interface Discount {
  id: string;
  tenantId: string;
  outletId: string | null;
  nama: string;
  rate: string;
  scope: 'product' | 'transaction';
  level: 'tenant' | 'outlet';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  tenant?: {
    id: string;
    nama: string;
  };
  products?: DiscountProduct[];
}

export interface CreateDiscountDto {
  tenantId: string;
  outletId?: string | null;
  productIds?: string[];
  nama: string;
  rate: string;
  scope?: 'product' | 'transaction';
  level?: 'tenant' | 'outlet';
  isActive?: boolean;
}

export interface UpdateDiscountDto {
  outletId?: string | null;
  productIds?: string[];
  nama?: string;
  rate?: string;
  scope?: 'product' | 'transaction';
  level?: 'tenant' | 'outlet';
  isActive?: boolean;
}

export const discountsApi = {
  getAll: async (filters?: {
    tenantId?: string;
    outletId?: string;
    isActive?: boolean;
    search?: string;
  }): Promise<{ data: Discount[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters?.tenantId) params.append('tenantId', filters.tenantId.toString());
    if (filters?.outletId) params.append('outletId', filters.outletId.toString());
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.search) params.append('search', filters.search);
    const query = params.toString();
    return fetchApi<{ data: Discount[]; meta: any }>(`/discounts${query ? `?${query}` : ''}`);
  },

  getActiveForOutlet: async (
    tenantId: string,
    outletId: string
  ): Promise<{ data: Discount[]; meta: any }> => {
    return fetchApi<{ data: Discount[]; meta: any }>(
      `/discounts/active-for-outlet?tenantId=${tenantId}&outletId=${outletId}`
    );
  },

  getById: async (id: string): Promise<Discount> => {
    return fetchApi<Discount>(`/discounts/${id}`);
  },

  create: async (data: CreateDiscountDto): Promise<Discount> => {
    return fetchApi<Discount>('/discounts', {
      method: 'POST',
      data,
    });
  },

  update: async (id: string, data: UpdateDiscountDto): Promise<Discount> => {
    return fetchApi<Discount>(`/discounts/${id}`, {
      method: 'PUT',
      data,
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchApi<void>(`/discounts/${id}`, {
      method: 'DELETE',
    });
  },
};
