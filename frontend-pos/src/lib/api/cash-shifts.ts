import { fetchApi } from './client';
import type { User } from './users';

export interface CashShift {
  id: string;
  tenantId: string;
  outletId: string;
  cashierId: string;
  jumlahBuka: string;
  jumlahTutup: string;
  jumlahExpected: string;
  selisih: string;
  status: 'buka' | 'tutup';
  openedAt: Date;
  closedAt: Date | null;
  catatan: string | null;
  createdAt: Date;
  updatedAt: Date;
  outlet?: {
    id: string;
    nama: string;
    alamat: string | null;
    isActive: boolean;
  };
  cashier?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateCashShiftDto {
  tenantId: string;
  outletId: string;
  cashierId?: string;
  jumlahBuka?: string;
  status?: 'buka' | 'tutup';
  catatan?: string | null;
}

export interface UpdateCashShiftDto {
  jumlahTutup?: string;
  jumlahExpected?: string;
  selisih?: string;
  status?: 'buka' | 'tutup';
  waktuTutup?: string;
  catatan?: string | null;
}

export interface CashShiftListResponse {
  data: CashShift[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CashShiftQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'buka' | 'tutup';
  tenantId?: string;
  outletId?: string;
  cashierId?: string;
}

export interface CashierShiftStatus {
  id: string;
  cashierId: string;
  status: 'buka' | 'tutup';
  outletId: string;
  outletName: string | null;
  jumlahBuka: string;
  openedAt: Date;
}

export const cashShiftsApi = {
  getAll: async (params?: CashShiftQueryParams): Promise<CashShiftListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
    if (params?.outletId) queryParams.append('outletId', params.outletId);
    const query = queryParams.toString();
    return fetchApi<CashShiftListResponse>(`/cash-shifts${query ? `?${query}` : ''}`);
  },

  getOpen: async (outletId?: string): Promise<CashShift | null> => {
    const params = new URLSearchParams();
    if (outletId) params.append('outletId', outletId);
    const query = params.toString();
    return fetchApi<CashShift | null>(`/cash-shifts/open${query ? `?${query}` : ''}`);
  },

  getMyOpen: async (): Promise<CashShift | null> => {
    return fetchApi<CashShift | null>('/cash-shifts/my-open');
  },

  getById: async (id: string): Promise<CashShift> => {
    return fetchApi<CashShift>(`/cash-shifts/${id}`);
  },

  create: async (data: CreateCashShiftDto): Promise<CashShift> => {
    return fetchApi<CashShift>('/cash-shifts', {
      method: 'POST',
      data,
    });
  },

  update: async (id: string, data: UpdateCashShiftDto): Promise<CashShift> => {
    return fetchApi<CashShift>(`/cash-shifts/${id}`, {
      method: 'PUT',
      data,
    });
  },

  delete: async (id: string): Promise<CashShift> => {
    return fetchApi<CashShift>(`/cash-shifts/${id}`, {
      method: 'DELETE',
    });
  },

  getCashiersStatus: async (cashierIds: string[]): Promise<CashierShiftStatus[]> => {
    return fetchApi<CashierShiftStatus[]>('/cash-shifts/cashiers/status', {
      method: 'POST',
      data: { cashierIds },
    });
  },

  getCashiers: async (): Promise<User[]> => {
    return fetchApi<User[]>('/cash-shifts/cashiers');
  },
};
