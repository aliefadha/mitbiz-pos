import { fetchApi } from "./client";

export interface Category {
  id: number;
  nama: string;
  deskripsi: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  tenantId: number;
  sku: string;
  barcode: string | null;
  nama: string;
  deskripsi: string | null;
  categoryId: number | null;
  category: Category | null;
  tipe: 'barang' | 'jasa' | 'digital';
  hargaBeli: string | null;
  hargaJual: string;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDto {
  tenantId: number;
  sku: string;
  barcode?: string;
  nama: string;
  deskripsi?: string;
  categoryId?: number;
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
  categoryId?: number;
  tipe?: 'barang' | 'jasa' | 'digital';
  hargaBeli?: string;
  hargaJual?: string;
  minStockLevel?: number;
  unit?: string;
  isActive?: boolean;
}

export interface AdjustStockDto {
  quantity: number;
  reason: string;
}

export interface StockAdjustmentResponse {
  message: string;
  adjustment: {
    id: number;
    productId: number;
    adjustmentType: string;
    quantity: number;
    reason: string;
    adjustedBy: number;
    createdAt: Date;
  };
  newQuantity: number;
}

export const productsApi = {
  getAll: async (filters?: { tenantId?: number; categoryId?: number; isActive?: boolean }): Promise<{ data: Product[]; meta: any }> => {
    const params = new URLSearchParams();
    if (filters?.tenantId) params.append("tenantId", filters.tenantId.toString());
    if (filters?.categoryId) params.append("categoryId", filters.categoryId.toString());
    if (filters?.isActive !== undefined) params.append("isActive", filters.isActive.toString());
    const query = params.toString();
    return fetchApi<{ data: Product[]; meta: any }>(`/products${query ? `?${query}` : ""}`);
  },

  getActive: async (): Promise<Product[]> => {
    return fetchApi<Product[]>("/products?isActive=true");
  },

  getById: async (id: number): Promise<Product> => {
    return fetchApi<Product>(`/products/${id}`);
  },

  create: async (data: CreateProductDto): Promise<Product> => {
    return fetchApi<Product>("/products", {
      method: "POST",
      data,
    });
  },

  update: async (id: number, data: UpdateProductDto): Promise<Product> => {
    return fetchApi<Product>(`/products/${id}`, {
      method: "PUT",
      data,
    });
  },

  adjustStock: async (id: number, data: AdjustStockDto): Promise<StockAdjustmentResponse> => {
    return fetchApi<StockAdjustmentResponse>(`/products/${id}/stock`, {
      method: "PUT",
      data,
    });
  },

  delete: async (id: number): Promise<{ message: string }> => {
    return fetchApi<{ message: string }>(`/products/${id}`, {
      method: "DELETE",
    });
  },

  getLowStock: async (): Promise<Product[]> => {
    return fetchApi<Product[]>("/products/low-stock");
  },
};
