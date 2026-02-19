import { fetchApi } from "./client";

export interface Outlet {
  id: number;
  tenantId: number;
  name: string;
  kode: string;
  alamat: string | null;
  noHp: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}

export interface OutletQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  tenantId?: number;
}

export const outletsApi = {
  getAll: async (
    params?: OutletQueryParams,
  ): Promise<{
    data: Outlet[];
    meta: { page: number; limit: number; total: number; totalPages: number };
  }> => {
    const queryString = params
      ? "?" +
        Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${value}`)
          .join("&")
      : "";
    const response = await fetchApi<{
      data: Outlet[];
      meta: { page: number; limit: number; total: number; totalPages: number };
    }>(`/outlets${queryString}`);
    return response;
  },

  getById: async (id: number): Promise<Outlet> => {
    return fetchApi<Outlet>(`/outlets/${id}`);
  },

  create: async (data: {
    tenantId: number;
    name: string;
    kode: string;
    alamat?: string;
    noHp?: string;
    isActive?: boolean;
  }): Promise<Outlet> => {
    return fetchApi<Outlet>("/outlets", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/outlets/${id}`, {
      method: "DELETE",
    });
  },
};
