import { fetchApi } from './client';

export interface Stock {
  id: string;
  productId: string;
  outletId: string;
  quantity: number;
  updatedAt: Date;
  product?: {
    id: string;
    nama: string;
    sku: string;
  };
  outlet?: {
    id: string;
    nama: string;
    kode: string;
  };
}

export interface CreateStockDto {
  productId: string;
  outletId: string;
  quantity: number;
}

export interface UpdateStockDto {
  quantity?: number;
}

export const stocksApi = {
  getAll: async (filters?: {
    productId?: string;
    outletId?: string;
  }): Promise<{ data: Stock[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters?.productId) params.append('productId', filters.productId.toString());
    if (filters?.outletId) params.append('outletId', filters.outletId.toString());
    const query = params.toString();
    return fetchApi<{ data: Stock[]; meta: any }>(`/stocks${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<Stock> => {
    return fetchApi<Stock>(`/stocks/${id}`);
  },

  create: async (data: CreateStockDto): Promise<Stock> => {
    return fetchApi<Stock>('/stocks', {
      method: 'POST',
      data,
    });
  },

  update: async (id: string, data: UpdateStockDto): Promise<Stock> => {
    return fetchApi<Stock>(`/stocks/${id}`, {
      method: 'PUT',
      data,
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/stocks/${id}`, {
      method: 'DELETE',
    });
  },
};
