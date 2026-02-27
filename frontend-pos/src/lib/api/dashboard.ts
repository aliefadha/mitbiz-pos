import { fetchApi } from './client';

export interface DashboardStats {
  totalPenjualan: number;
  totalTransaksi: number;
  totalPajak: number;
  totalDiskon: number;
  rataTransaksi: number;
  cabangAktif: number;
  kasirAktif: number;
  produkAktif: number;
  totalCabang: number;
  totalProduk: number;
}

export interface SalesTrendData {
  date: string;
  revenue: number;
  orders: number;
}

export interface SalesByBranchData {
  outletId: string;
  outletName: string;
  revenue: number;
  orders: number;
}

export interface SalesByPaymentMethodData {
  paymentMethodId: string;
  paymentMethodName: string;
  revenue: number;
  orders: number;
}

export interface DashboardQueryParams {
  startDate?: string;
  endDate?: string;
  outletId?: string;
  tenantId?: string;
}

export const dashboardApi = {
  getStats: async (params?: DashboardQueryParams): Promise<DashboardStats> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.outletId) queryParams.append('outletId', params.outletId);
    if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
    const query = queryParams.toString();
    return fetchApi<DashboardStats>(`/dashboard/stats${query ? `?${query}` : ''}`);
  },

  getSalesTrend: async (params?: DashboardQueryParams): Promise<SalesTrendData[]> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.outletId) queryParams.append('outletId', params.outletId);
    if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
    const query = queryParams.toString();
    return fetchApi<SalesTrendData[]>(`/dashboard/sales-trend${query ? `?${query}` : ''}`);
  },

  getSalesByBranch: async (params?: DashboardQueryParams): Promise<SalesByBranchData[]> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.outletId) queryParams.append('outletId', params.outletId);
    if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
    const query = queryParams.toString();
    return fetchApi<SalesByBranchData[]>(`/dashboard/sales-by-branch${query ? `?${query}` : ''}`);
  },

  getSalesByPaymentMethod: async (
    params?: DashboardQueryParams
  ): Promise<SalesByPaymentMethodData[]> => {
    const queryParams = new URLSearchParams();
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.outletId) queryParams.append('outletId', params.outletId);
    if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
    const query = queryParams.toString();
    return fetchApi<SalesByPaymentMethodData[]>(
      `/dashboard/sales-by-payment-method${query ? `?${query}` : ''}`
    );
  },
};
