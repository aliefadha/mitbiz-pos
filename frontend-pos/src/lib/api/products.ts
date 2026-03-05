import { fetchApi } from './client';

export interface Category {
  id: string;
  nama: string;
  deskripsi: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductDiscount {
  id: string;
  discountId: string;
  productId: string;
  discount: {
    id: string;
    nama: string;
    rate: string;
    scope: 'product' | 'transaction';
    level: 'tenant' | 'outlet';
    isActive: boolean;
  };
}

export interface Product {
  id: string;
  tenantId: string;
  sku: string;
  barcode: string | null;
  nama: string;
  deskripsi: string | null;
  categoryId: string | null;
  category: Category | null;
  tipe: 'barang' | 'jasa' | 'digital';
  hargaBeli: string | null;
  hargaJual: string;
  stock: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  discountProducts?: ProductDiscount[];
}

export interface CreateProductDto {
  tenantId: string;
  sku: string;
  barcode?: string;
  nama: string;
  deskripsi?: string;
  categoryId?: string;
  tipe?: 'barang' | 'jasa' | 'digital';
  hargaBeli?: string;
  hargaJual: string;
  stockQuantity?: number;
  minStockLevel?: number;
  unit?: string;
  isActive?: boolean;
}

export interface UpdateProductDto {
  sku?: string;
  barcode?: string;
  nama?: string;
  deskripsi?: string;
  categoryId?: string;
  tipe?: 'barang' | 'jasa' | 'digital';
  hargaBeli?: string;
  hargaJual?: string;
  minStockLevel?: number;
  unit?: string;
  isActive?: boolean;
  discountIds?: string[];
}

export interface AdjustStockDto {
  quantity: number;
  reason: string;
}

export interface StockAdjustmentResponse {
  message: string;
  adjustment: {
    id: string;
    productId: string;
    adjustmentType: string;
    quantity: number;
    reason: string;
    adjustedBy: string;
    createdAt: Date;
  };
  newQuantity: number;
}

export const productsApi = {
  getAll: async (filters?: {
    tenantId?: string;
    outletId?: string;
    categoryId?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Product[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters?.tenantId) params.append('tenantId', filters.tenantId.toString());
    if (filters?.outletId) params.append('outletId', filters.outletId.toString());
    if (filters?.categoryId) params.append('categoryId', filters.categoryId.toString());
    if (filters?.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    const query = params.toString();
    return fetchApi<{ data: Product[]; meta: any }>(`/products${query ? `?${query}` : ''}`);
  },

  getById: async (id: string): Promise<Product> => {
    return fetchApi<Product>(`/products/${id}`);
  },

  create: async (data: CreateProductDto): Promise<Product> => {
    return fetchApi<Product>('/products', {
      method: 'POST',
      data,
    });
  },

  update: async (id: string, data: UpdateProductDto): Promise<Product> => {
    return fetchApi<Product>(`/products/${id}`, {
      method: 'PUT',
      data,
    });
  },

  delete: async (id: string): Promise<void> => {
    return fetchApi<void>(`/products/${id}`, {
      method: 'DELETE',
    });
  },

  adjustStock: async (id: string, data: AdjustStockDto): Promise<StockAdjustmentResponse> => {
    return fetchApi<StockAdjustmentResponse>(`/products/${id}/adjust-stock`, {
      method: 'POST',
      data,
    });
  },
};
