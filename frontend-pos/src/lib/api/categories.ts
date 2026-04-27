import { fetchApi } from './client';

export interface Category {
  id: string;
  tenantId: string;
  nama: string;
  deskripsi: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  productsCount?: number;
}

export interface CreateCategoryDto {
  tenantId: string;
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
  getAll: async (filters?: {
    tenantId?: string;
    isActive?: boolean;
  }): Promise<{ data: Category[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters?.tenantId) params.append('tenantId', filters.tenantId.toString());
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    const query = params.toString();
    return fetchApi<{ data: Category[]; meta: any }>(`/categories${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<Category> => {
    return fetchApi<Category>(`/categories/${id}`);
  },

  create: async (data: CreateCategoryDto): Promise<void> => {
    return fetchApi<void>('/categories', {
      method: 'POST',
      data,
    });
  },

  update: async (id: string, data: UpdateCategoryDto): Promise<void> => {
    return fetchApi<void>(`/categories/${id}`, {
      method: 'PUT',
      data,
    });
  },

  toggleStatus: async (id: string): Promise<Category> => {
    return fetchApi<Category>(`/categories/${id}/toggle-status`, {
      method: 'PUT',
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchApi<void>(`/categories/${id}`, {
      method: 'DELETE',
    });
  },
};
