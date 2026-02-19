import { fetchApi } from "./client";

export interface StockAdjustment {
  id: number;
  outletId: number;
  productId: number;
  quantity: number;
  alasan: string | null;
  adjustedBy: string;
  createdAt: Date;
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
  user?: {
    id: string;
    name: string | null;
    email: string;
  };
}

export interface CreateStockAdjustmentDto {
  productId: number;
  outletId: number;
  quantity: number;
  alasan?: string;
  adjustedBy: string;
}

export const stockAdjustmentsApi = {
  getAll: async (filters?: {
    productId?: number;
    outletId?: number;
  }): Promise<{ data: StockAdjustment[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters?.productId)
      params.append("productId", filters.productId.toString());
    if (filters?.outletId)
      params.append("outletId", filters.outletId.toString());
    const query = params.toString();
    return fetchApi<{ data: StockAdjustment[]; meta: any }>(
      `/stock-adjustments${query ? `?${query}` : ""}`,
    );
  },

  getById: async (id: number): Promise<StockAdjustment> => {
    return fetchApi<StockAdjustment>(`/stock-adjustments/${id}`);
  },

  create: async (data: CreateStockAdjustmentDto): Promise<StockAdjustment> => {
    return fetchApi<StockAdjustment>("/stock-adjustments", {
      method: "POST",
      data,
    });
  },
};
