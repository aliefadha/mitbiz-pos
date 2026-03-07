import { fetchApi } from './client';

export interface TaxBreakdown {
  taxId: string;
  nama: string;
  rate: string;
  amount: number;
}

export interface DiscountBreakdown {
  discountId: string;
  nama: string;
  rate: string;
  amount: number;
}

export interface Order {
  id: string;
  tenantId: string;
  outletId: string;
  orderNumber: string;
  cashierId: string;
  cashShiftId: string | null;
  status: 'complete' | 'cancel' | 'refunded';
  subtotal: string;
  jumlahPajak: string;
  pajakBreakdown: TaxBreakdown[] | null;
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
    alamat: string | null;
    isActive: boolean;
  };
  paymentMethod?: {
    id: string;
    nama: string;
  };
  orderItems?: OrderItem[];
  cashier?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface OrderItem {
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

export interface CreateOrderDto {
  tenantId: string;
  outletId: string;
  status?: 'complete' | 'cancel' | 'refunded';
  subtotal?: string;
  jumlahPajak?: string;
  pajakBreakdown?: TaxBreakdown[];
  jumlahDiskon?: string;
  diskonBreakdown?: DiscountBreakdown[];
  paymentMethodId?: string | null;
  total?: string;
  notes?: string | null;
  nomorAntrian?: string | null;
  completedAt?: string | null;
  items?: CreateOrderItemDto[];
}

export interface CreateOrderItemDto {
  productId: string;
  quantity: number;
  hargaSatuan: string;
  jumlahDiskon?: string;
  total: string;
}

export interface UpdateOrderDto {
  outletId?: string;
  orderNumber?: string;
  status?: 'complete' | 'cancel' | 'refunded';
  subtotal?: string;
  jumlahPajak?: string;
  pajakBreakdown?: TaxBreakdown[];
  jumlahDiskon?: string;
  diskonBreakdown?: DiscountBreakdown[];
  paymentMethodId?: string | null;
  total?: string;
  notes?: string | null;
  completedAt?: string | null;
}

export interface OrderListResponse {
  data: Order[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface OrderQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: 'complete' | 'cancel' | 'refunded';
  tenantId?: string;
  outletId?: string;
  cashShiftId?: string;
}

export const ordersApi = {
  getAll: async (params?: OrderQueryParams): Promise<OrderListResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.search) queryParams.append('search', params.search);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
    if (params?.outletId) queryParams.append('outletId', params.outletId);
    if (params?.cashShiftId) queryParams.append('cashShiftId', params.cashShiftId);
    const query = queryParams.toString();
    return fetchApi<OrderListResponse>(`/orders${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<Order> => {
    return fetchApi<Order>(`/orders/${id}`);
  },

  create: async (data: CreateOrderDto): Promise<Order> => {
    return fetchApi<Order>('/orders', {
      method: 'POST',
      data,
    });
  },

  update: async (id: string, data: UpdateOrderDto): Promise<Order> => {
    return fetchApi<Order>(`/orders/${id}`, {
      method: 'PUT',
      data,
    });
  },

  delete: async (id: string): Promise<Order> => {
    return fetchApi<Order>(`/orders/${id}`, {
      method: 'DELETE',
    });
  },
};
