import { fetchApi } from "./client";

export interface Stock {
  id: number;
  productId: number;
  outletId: number;
  quantity: number;
  updatedAt: Date;
  product?: {
    id: number;
    nama: string;
    sku: string;
  };
  outlet?: {
    id: number;
    name: string;
    kode: string;
  };
}

export interface CreateStockDto {
  productId: number;
  outletId: number;
  quantity: number;
}

export interface UpdateStockDto {
  quantity?: number;
}

export const stocksApi = {
  getAll: async (filters?: { productId?: number; outletId?: number }): Promise<{ data: Stock[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters?.productId) params.append("productId", filters.productId.toString());
    if (filters?.outletId) params.append("outletId", filters.outletId.toString());
    const query = params.toString();
    return fetchApi<{ data: Stock[]; meta: any }>(`/stocks${query ? `?${query}` : ""}`);
  },

  getById: async (id: number): Promise<Stock> => {
    return fetchApi<Stock>(`/stocks/${id}`);
  },

  create: async (data: CreateStockDto): Promise<Stock> => {
    return fetchApi<Stock>("/stocks", {
      method: "POST",
      data,
    });
  },

  update: async (id: number, data: UpdateStockDto): Promise<Stock> => {
    return fetchApi<Stock>(`/stocks/${id}`, {
      method: "PUT",
      data,
    });
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/stocks/${id}`, {
      method: "DELETE",
    });
  },
};
