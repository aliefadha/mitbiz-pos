import { fetchApi } from './client';

export type BillingCycle = 'monthly' | 'quarterly' | 'semi_annual' | 'yearly';

export interface BillingCyclePrice {
  cycle: BillingCycle;
  price: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  isActive: boolean;
  billingCycles: BillingCyclePrice[];
  createdAt: string;
  updatedAt: string;
}

export interface PlanQueryParams {
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface CreatePlanDto {
  name: string;
  billingCycles: BillingCyclePrice[];
  isActive?: boolean;
}

export interface UpdatePlanDto {
  name?: string;
  billingCycles?: BillingCyclePrice[];
  isActive?: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface TenantSubscription {
  subscription: {
    id: string;
    status: string;
    startedAt: string;
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
  };
  tenant: {
    id: string;
    nama: string;
    slug: string;
  };
}

export interface TenantWithActiveSubscription {
  subscription: {
    id: string;
    status: string;
    startedAt: string;
    expiresAt: string;
  };
  tenant: {
    id: string;
    nama: string;
    slug: string;
  };
  plan: {
    id: string;
    name: string;
  };
}

export type SubscriptionHistoryAction = 'subscribed' | 'renewed' | 'changed' | 'cancelled';

export interface SubscriptionHistory {
  id: string;
  tenantId: string;
  tenantName: string;
  tenantSlug: string;
  subscriptionId: string | null;
  planId: string;
  planName: string;
  billingCycle?: string;
  action: SubscriptionHistoryAction;
  amountPaid: string | null;
  invoiceRef: string | null;
  periodStart: string;
  periodEnd: string;
  performedBy: string | null;
  createdAt: string;
}

export interface SubscriptionHistoryQueryParams {
  action?: SubscriptionHistoryAction;
  tenantId?: string;
  page?: number;
  limit?: number;
}

export const subscriptionPlansApi = {
  getAll: async (params?: PlanQueryParams): Promise<PaginatedResponse<SubscriptionPlan>> => {
    const queryParams = new URLSearchParams();
    if (params?.isActive !== undefined) queryParams.append('isActive', String(params.isActive));
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const query = queryParams.toString();
    return fetchApi<PaginatedResponse<SubscriptionPlan>>(
      `/subscription-plans${query ? `?${query}` : ''}`
    );
  },

  getById: async (id: string): Promise<SubscriptionPlan> => {
    return fetchApi<SubscriptionPlan>(`/subscription-plans/${id}`);
  },

  create: async (data: CreatePlanDto): Promise<SubscriptionPlan> => {
    return fetchApi<SubscriptionPlan>('/subscription-plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: UpdatePlanDto): Promise<SubscriptionPlan> => {
    return fetchApi<SubscriptionPlan>(`/subscription-plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/subscription-plans/${id}`, {
      method: 'DELETE',
    });
  },

  getPlanSubscriptions: async (planId: string): Promise<TenantSubscription[]> => {
    return fetchApi<TenantSubscription[]>(`/subscription-plans/${planId}/subscriptions`);
  },

  getTenantsWithActiveSubscriptions: async (): Promise<TenantWithActiveSubscription[]> => {
    return fetchApi<TenantWithActiveSubscription[]>(
      '/subscription-plans/active-subscriptions/tenants'
    );
  },

  getPlanHistory: async (
    planId: string,
    params?: SubscriptionHistoryQueryParams
  ): Promise<PaginatedResponse<SubscriptionHistory>> => {
    const queryParams = new URLSearchParams();
    if (params?.action) queryParams.append('action', params.action);
    if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const query = queryParams.toString();
    return fetchApi<PaginatedResponse<SubscriptionHistory>>(
      `/subscription-plans/${planId}/history${query ? `?${query}` : ''}`
    );
  },

  cancelSubscription: async (subscriptionId: string): Promise<any> => {
    return fetchApi<any>(`/subscription-plans/subscriptions/${subscriptionId}/cancel`, {
      method: 'PUT',
    });
  },

  renewSubscription: async (subscriptionId: string): Promise<any> => {
    return fetchApi<any>(`/subscription-plans/subscriptions/${subscriptionId}/renew`, {
      method: 'PUT',
    });
  },

  getTenantHistory: async (
    slug: string,
    params?: SubscriptionHistoryQueryParams
  ): Promise<PaginatedResponse<SubscriptionHistory>> => {
    const queryParams = new URLSearchParams();
    if (params?.action) queryParams.append('action', params.action);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const query = queryParams.toString();
    return fetchApi<PaginatedResponse<SubscriptionHistory>>(
      `/tenants/${slug}/subscription/history${query ? `?${query}` : ''}`
    );
  },

  getAllHistory: async (
    params?: SubscriptionHistoryQueryParams
  ): Promise<PaginatedResponse<SubscriptionHistory>> => {
    const queryParams = new URLSearchParams();
    if (params?.action) queryParams.append('action', params.action);
    if (params?.tenantId) queryParams.append('tenantId', params.tenantId);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const query = queryParams.toString();
    return fetchApi<PaginatedResponse<SubscriptionHistory>>(
      `/subscription-plans/history${query ? `?${query}` : ''}`
    );
  },
};
