import { fetchApi } from './client';

export type BillingCycle = 'monthly' | 'quarterly' | 'yearly';

export interface SubscriptionPlan {
  id: string;
  name: string;
  billingCycle: BillingCycle;
  price: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  planProFeatures?: Array<{
    id: string;
    planId: string;
    proFeatureId: string;
    createdAt: string;
    proFeature: ProFeature;
  }>;
}

export interface ProFeature {
  id: string;
  key: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProFeatureWithStatus extends ProFeature {
  isIncluded: boolean;
}

export interface Resource {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PlanResource {
  id: string;
  planId: string;
  resourceId: string;
  isIncluded: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceWithStatus extends Resource {
  isIncluded: boolean;
}

export interface PlanQueryParams {
  isActive?: boolean;
  billingCycle?: BillingCycle;
  page?: number;
  limit?: number;
}

export interface CreatePlanDto {
  name: string;
  billingCycle: BillingCycle;
  price: string;
  isActive?: boolean;
  proFeatureIds?: string[];
}

export interface UpdatePlanDto {
  name?: string;
  billingCycle?: BillingCycle;
  price?: string;
  isActive?: boolean;
}

export interface BulkResourceUpdate {
  resourceId: string;
  isIncluded: boolean;
}

export interface ManageResourceDto {
  resourceId: string;
  isIncluded: boolean;
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
    if (params?.billingCycle) queryParams.append('billingCycle', params.billingCycle);
    if (params?.page) queryParams.append('page', String(params.page));
    if (params?.limit) queryParams.append('limit', String(params.limit));
    const query = queryParams.toString();
    return fetchApi<PaginatedResponse<SubscriptionPlan>>(
      `/subscription-plans${query ? `?${query}` : ''}`
    );
  },

  getAllProFeatures: async (): Promise<ProFeature[]> => {
    return fetchApi<ProFeature[]>('/pro-features');
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

  getResources: async (planId: string): Promise<ResourceWithStatus[]> => {
    return fetchApi<ResourceWithStatus[]>(`/subscription-plans/${planId}/resources`);
  },

  addResource: async (planId: string, data: ManageResourceDto): Promise<PlanResource> => {
    return fetchApi<PlanResource>(`/subscription-plans/${planId}/resources`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  removeResource: async (planId: string, resourceId: string): Promise<PlanResource | null> => {
    return fetchApi<PlanResource | null>(`/subscription-plans/${planId}/resources/${resourceId}`, {
      method: 'DELETE',
    });
  },

  updateResourcesBulk: async (
    planId: string,
    resources: BulkResourceUpdate[]
  ): Promise<ResourceWithStatus[]> => {
    return fetchApi<ResourceWithStatus[]>(`/subscription-plans/${planId}/resources/bulk`, {
      method: 'POST',
      body: JSON.stringify({ resources }),
    });
  },

  addAllResources: async (planId: string): Promise<ResourceWithStatus[]> => {
    return fetchApi<ResourceWithStatus[]>(`/subscription-plans/${planId}/resources/all`, {
      method: 'POST',
    });
  },

  getProFeatures: async (planId: string): Promise<ProFeatureWithStatus[]> => {
    return fetchApi<ProFeatureWithStatus[]>(`/subscription-plans/${planId}/pro-features`);
  },

  addProFeature: async (planId: string, proFeatureId: string): Promise<void> => {
    return fetchApi<void>(`/subscription-plans/${planId}/pro-features`, {
      method: 'POST',
      body: JSON.stringify({ proFeatureId }),
    });
  },

  removeProFeature: async (planId: string, proFeatureId: string): Promise<void> => {
    return fetchApi<void>(`/subscription-plans/${planId}/pro-features/${proFeatureId}`, {
      method: 'DELETE',
    });
  },

  updateProFeaturesBulk: async (
    planId: string,
    proFeatures: Array<{ proFeatureId: string; isIncluded: boolean }>
  ): Promise<ProFeatureWithStatus[]> => {
    return fetchApi<ProFeatureWithStatus[]>(`/subscription-plans/${planId}/pro-features/bulk`, {
      method: 'POST',
      body: JSON.stringify({ proFeatures }),
    });
  },

  addAllProFeatures: async (planId: string): Promise<ProFeatureWithStatus[]> => {
    return fetchApi<ProFeatureWithStatus[]>(`/subscription-plans/${planId}/pro-features/all`, {
      method: 'POST',
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
