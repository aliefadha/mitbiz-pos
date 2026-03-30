import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateProductSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  sku: z.string().max(50).optional().nullable(),
  nama: z.string().min(1, 'Product name is required').max(255),
  deskripsi: z.string().max(1000).optional().nullable(),
  categoryId: z.string().min(1).optional().nullable(),
  hargaBeli: z.string().optional().nullable().default('0'),
  hargaJual: z.string().optional().default('0'),
  unit: z.string().max(20).default('pcs'),
  minStockLevel: z.number().int().min(0).default(0),
  enableMinStock: z.boolean().default(false),
  enableStockTracking: z.boolean().optional(),
  isActive: z.boolean().default(true),
});

export const UpdateProductSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  nama: z.string().min(1).max(255).optional(),
  deskripsi: z.string().max(1000).optional().nullable(),
  categoryId: z.string().min(1).optional().nullable(),
  hargaBeli: z.string().optional().nullable(),
  hargaJual: z.string().min(1).optional(),
  unit: z.string().max(20).optional(),
  minStockLevel: z.number().int().min(0).optional(),
  enableMinStock: z.boolean().optional(),
  enableStockTracking: z.boolean().optional(),
  isActive: z.boolean().optional(),
  discountIds: z.array(z.string().min(1)).optional(),
});

export const ProductIdSchema = z.object({
  id: z.string().min(1, 'Product ID is required'),
});

export const ProductQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    })
    .optional(),
  limit: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 100);
    })
    .optional(),
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  tenantId: z.string().min(1).optional(),
  categoryId: z.string().min(1).optional(),
  outletId: z.string().min(1).optional(),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
export class ProductIdDto extends createZodDto(ProductIdSchema) {}
export class ProductQueryDto extends createZodDto(ProductQuerySchema) {}
