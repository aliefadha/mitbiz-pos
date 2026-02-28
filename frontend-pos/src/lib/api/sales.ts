import { fetchApi } from "./client";

export interface TopProduct {
  productId: string;
  productName: string;
  productSku: string | null;
  categoryId: string | null;
  categoryName: string | null;
  totalQuantity: number;
  totalRevenue: number;
  totalOrders: number;
}

export interface SalesByCategory {
  categoryId: string | null;
  categoryName: string;
  totalQuantity: number;
  totalRevenue: number;
  totalOrders: number;
}

export interface SalesByProduct {
  productId: string;
  productName: string;
  productSku: string | null;
  totalQuantity: number;
  totalRevenue: number;
  totalOrders: number;
  averagePrice: number;
}

export interface SalesQueryParams {
  startDate?: string;
  endDate?: string;
  outletId?: string;
  tenantId?: string;
  categoryId?: string;
}

const buildQuery = (params?: SalesQueryParams) => {
  const queryParams = new URLSearchParams();
  if (params?.startDate) queryParams.append("startDate", params.startDate);
  if (params?.endDate) queryParams.append("endDate", params.endDate);
  if (params?.outletId) queryParams.append("outletId", params.outletId);
  if (params?.tenantId) queryParams.append("tenantId", params.tenantId);
  if (params?.categoryId) queryParams.append("categoryId", params.categoryId);
  return queryParams.toString();
};

export const salesApi = {
  getTopProducts: async (
    params?: SalesQueryParams & { limit?: number },
  ): Promise<TopProduct[]> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append("startDate", params.startDate);
    if (params?.endDate) queryParams.append("endDate", params.endDate);
    if (params?.outletId) queryParams.append("outletId", params.outletId);
    if (params?.tenantId) queryParams.append("tenantId", params.tenantId);
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    const query = queryParams.toString();
    return fetchApi<TopProduct[]>(
      `/sales/top-products${query ? `?${query}` : ""}`,
    );
  },

  getSalesByCategory: async (
    params?: SalesQueryParams,
  ): Promise<SalesByCategory[]> => {
    const query = buildQuery(params);
    return fetchApi<SalesByCategory[]>(
      `/sales/by-category${query ? `?${query}` : ""}`,
    );
  },

  getSalesByProduct: async (
    params?: SalesQueryParams,
  ): Promise<SalesByProduct[]> => {
    const query = buildQuery(params);
    return fetchApi<SalesByProduct[]>(
      `/sales/by-product${query ? `?${query}` : ""}`,
    );
  },
};
