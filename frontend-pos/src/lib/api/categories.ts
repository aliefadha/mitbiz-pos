import { fetchApi } from "./client";

export interface Category {
  id: number;
  tenantId: number;
  nama: string;
  deskripsi: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  productsCount?: number;
}

export interface CreateCategoryDto {
  tenantId: number;
  nama: string;
  deskripsi?: string;
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  nama?: string;
  deskripsi?: string;
  isActive?: boolean;
}

export const categoriesApi = {
  getAll: async (filters?: { tenantId?: number; isActive?: boolean }): Promise<{ data: Category[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters?.tenantId) params.append("tenantId", filters.tenantId.toString());
    if (filters?.isActive !== undefined) params.append("isActive", filters.isActive.toString());
    const query = params.toString();
    return fetchApi<{ data: Category[]; meta: any }>(`/categories${query ? `?${query}` : ""}`);
  },

  getById: async (id: number): Promise<Category> => {
    return fetchApi<Category>(`/categories/${id}`);
  },

  create: async (data: CreateCategoryDto): Promise<Category> => {
    return fetchApi<Category>("/categories", {
      method: "POST",
      data,
    });
  },

  update: async (id: number, data: UpdateCategoryDto): Promise<Category> => {
    return fetchApi<Category>(`/categories/${id}`, {
      method: "PUT",
      data,
    });
  },

  toggleStatus: async (id: number): Promise<Category> => {
    return fetchApi<Category>(`/categories/${id}/toggle-status`, {
      method: "PUT",
    });
  },

  delete: async (id: number): Promise<void> => {
    return fetchApi<void>(`/categories/${id}`, {
      method: "DELETE",
    });
  },
};
