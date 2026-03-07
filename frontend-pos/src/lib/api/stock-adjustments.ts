import { fetchApi } from './client';

export interface StockAdjustment {
  id: string;
  outletId: string;
  productId: string;
  quantity: number;
  alasan: string | null;
  adjustedBy: string;
  createdAt: Date;
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
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface CreateStockAdjustmentDto {
  productId: string;
  outletId: string;
  quantity: number;
  alasan?: string;
  adjustedBy?: string;
}

export const stockAdjustmentsApi = {
  getAll: async (filters?: {
    productId?: string;
    outletId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: StockAdjustment[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters?.productId) params.append('productId', filters.productId.toString());
    if (filters?.outletId) params.append('outletId', filters.outletId.toString());
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const query = params.toString();
    return fetchApi<{ data: StockAdjustment[]; meta: any }>(
      `/stock-adjustments${query ? `?${query}` : ''}`
    );
  },

  getById: async (id: string): Promise<StockAdjustment> => {
    return fetchApi<StockAdjustment>(`/stock-adjustments/${id}`);
  },

  create: async (data: CreateStockAdjustmentDto): Promise<StockAdjustment> => {
    return fetchApi<StockAdjustment>('/stock-adjustments', {
      method: 'POST',
      data,
    });
  },
};
