import { fetchApi } from './client';
import type { DiscountBreakdown } from './orders';

export interface OpenBill {
  id: string;
  tenantId: string;
  outletId: string;
  orderNumber: string;
  cashierId: string;
  status: 'open' | 'complete' | 'cancel' | 'refunded';
  subtotal: string;
  jumlahPajak: string;
  jumlahDiskon: string;
  diskonBreakdown: DiscountBreakdown[] | null;
  paymentMethodId: string | null;
  total: string;
  notes: string | null;
  nomorAntrian: string | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  outlet?: {
    id: string;
    nama: string;
  };
  cashier?: {
    id: string;
    name: string;
    email: string;
  };
  paymentMethod?: {
    id: string;
    nama: string;
  };
  orderItems?: OpenBillItem[];
}

export interface OpenBillItem {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  hargaSatuan: string;
  jumlahDiskon: string;
  total: string;
  product?: {
    id: string;
    sku: string;
    nama: string;
  };
}

export interface CreateOpenBillDto {
  tenantId: string;
  outletId: string;
  notes?: string | null;
  nomorAntrian?: string | null;
  items?: CreateOpenBillItemDto[];
}

export interface CreateOpenBillItemDto {
  productId: string;
  quantity: number;
  hargaSatuan: string;
  jumlahDiskon?: string;
  total: string;
}

export interface UpdateOpenBillDto {
  notes?: string | null;
  nomorAntrian?: string | null;
}

export interface AddItemToOpenBillDto {
  productId: string;
  quantity: number;
  hargaSatuan: string;
  jumlahDiskon?: string;
  total: string;
}

export interface CloseOpenBillDto {
  paymentMethodId?: string | null;
  notes?: string | null;
}

export interface OpenBillListResponse {
  data: OpenBill[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OpenBillQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  tenantId?: string;
  outletId?: string;
}

export const openBillsApi = {
  getAll: async (params?: OpenBillQueryParams): Promise<OpenBillListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
    if (params?.outletId) queryParams.append('outletId', params.outletId);
    const query = queryParams.toString();
    return fetchApi<OpenBillListResponse>(`/openbills${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<OpenBill> => {
    return fetchApi<OpenBill>(`/openbills/${id}`);
  },

  create: async (data: CreateOpenBillDto): Promise<OpenBill> => {
    return fetchApi<OpenBill>('/openbills', {
      method: 'POST',
      data,
    });
  },

  update: async (id: string, data: UpdateOpenBillDto): Promise<OpenBill> => {
    return fetchApi<OpenBill>(`/openbills/${id}`, {
      method: 'PUT',
      data,
    });
  },

  addItem: async (id: string, item: AddItemToOpenBillDto): Promise<OpenBillItem> => {
    return fetchApi<OpenBillItem>(`/openbills/${id}/items`, {
      method: 'POST',
      data: item,
    });
  },

  replaceItems: async (id: string, items: CreateOpenBillItemDto[]): Promise<OpenBill> => {
    return fetchApi<OpenBill>(`/openbills/${id}/items`, {
      method: 'PUT',
      data: { items },
    });
  },

  removeItem: async (id: string, itemId: string): Promise<{ success: boolean }> => {
    return fetchApi<{ success: boolean }>(`/openbills/${id}/items/${itemId}`, {
      method: 'DELETE',
    });
  },

  close: async (id: string, data: CloseOpenBillDto): Promise<OpenBill> => {
    return fetchApi<OpenBill>(`/openbills/${id}/close`, {
      method: 'POST',
      data,
    });
  },

  cancel: async (id: string): Promise<{ success: boolean }> => {
    return fetchApi<{ success: boolean }>(`/openbills/${id}/cancel`, {
      method: 'POST',
    });
  },
};
