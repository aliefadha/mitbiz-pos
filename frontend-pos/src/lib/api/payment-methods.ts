import { fetchApi } from "./client";

export interface PaymentMethod {
  id: string;
  tenantId: string;
  nama: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentMethodDto {
  tenantId: string;
  nama: string;
  isActive?: boolean;
}

export interface UpdatePaymentMethodDto {
  nama?: string;
  isActive?: boolean;
}

export const paymentMethodsApi = {
  getAll: async (filters?: { tenantId?: string; isActive?: boolean }): Promise<{ data: PaymentMethod[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters?.tenantId) params.append("tenantId", filters.tenantId.toString());
    if (filters?.isActive !== undefined) params.append("isActive", filters.isActive.toString());
    const query = params.toString();
    return fetchApi<{ data: PaymentMethod[]; meta: any }>(`/payment-methods${query ? `?${query}` : ""}`);
  },

  getById: async (id: string): Promise<PaymentMethod> => {
    return fetchApi<PaymentMethod>(`/payment-methods/${id}`);
  },

  create: async (data: CreatePaymentMethodDto): Promise<PaymentMethod> => {
    return fetchApi<PaymentMethod>("/payment-methods", {
      method: "POST",
      data,
    });
  },

  update: async (id: string, data: UpdatePaymentMethodDto): Promise<PaymentMethod> => {
    return fetchApi<PaymentMethod>(`/payment-methods/${id}`, {
      method: "PUT",
      data,
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchApi<void>(`/payment-methods/${id}`, {
      method: "DELETE",
    });
  },
};
