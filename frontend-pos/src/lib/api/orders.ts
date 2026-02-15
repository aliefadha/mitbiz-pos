import { fetchApi } from "./client";

export interface OrderItemProduct {
  id: number;
  sku: string;
  name: string;
  category: {
    id: number;
    name: string;
  } | null;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  unitPrice: string;
  discountAmount: string;
  totalPrice: string;
  product: OrderItemProduct;
}

export interface Payment {
  id: number;
  orderId: number;
  method: string;
  amount: string;
  status: string;
  referenceCode: string | null;
  paidAt: Date;
}

export interface Cashier {
  id: number;
  email: string;
  nama: string;
}

export interface Order {
  id: number;
  orderNumber: string;
  cashierId: number;
  cashier: Cashier | null;
  status: 'complete' | 'cancel' | 'refunded';
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  notes: string | null;
  items: OrderItem[];
  payments: Payment[];
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
}

export interface CreateOrderItemDto {
  productId: number;
  quantity: number;
  discountAmount?: number;
}

export interface CreatePaymentDto {
  method: 'cash' | 'card' | 'bank_transfer' | 'qris' | 'e_wallet' | 'other';
  amount: number;
  referenceCode?: string;
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
  discountAmount?: number;
  notes?: string;
  payments: CreatePaymentDto[];
}

export interface OrderListResponse {
  id: number;
  orderNumber: string;
  cashierId: number;
  status: 'complete' | 'cancel' | 'refunded';
  subtotal: string;
  taxAmount: string;
  discountAmount: string;
  totalAmount: string;
  createdAt: Date;
}

export const ordersApi = {
  getAll: async (filters?: {
    status?: 'complete' | 'cancel' | 'refunded';
    cashierId?: number;
    startDate?: string;
    endDate?: string;
  }): Promise<OrderListResponse[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.cashierId) params.append('cashierId', filters.cashierId.toString());
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    const query = params.toString();
    return fetchApi<OrderListResponse[]>(`/orders${query ? `?${query}` : ''}`);
  },

  getById: async (id: number): Promise<Order> => {
    return fetchApi<Order>(`/orders/${id}`);
  },

  create: async (data: CreateOrderDto): Promise<Order> => {
    return fetchApi<Order>('/orders', {
      method: 'POST',
      data,
    });
  },

  cancel: async (id: number): Promise<Order> => {
    return fetchApi<Order>(`/orders/${id}/cancel`, {
      method: 'PUT',
    });
  },

  refund: async (id: number): Promise<Order> => {
    return fetchApi<Order>(`/orders/${id}/refund`, {
      method: 'PUT',
    });
  },
};
