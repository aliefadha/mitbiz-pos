import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const ProductTypeSchema = z.enum(['barang', 'jasa', 'digital']);

export const CreateProductSchema = z.object({
  tenantId: z.number().int().positive('Tenant ID is required'),
  sku: z.string().min(1, 'SKU is required').max(50),
  barcode: z.string().max(50).optional().nullable(),
  nama: z.string().min(1, 'Product name is required').max(255),
  deskripsi: z.string().max(1000).optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  tipe: ProductTypeSchema.default('barang'),
  hargaBeli: z.string().optional().nullable().default('0'),
  hargaJual: z.string().optional().default('0'),
  unit: z.string().max(20).default('pcs'),
  minStockLevel: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const UpdateProductSchema = z.object({
  sku: z.string().min(1).max(50).optional(),
  barcode: z.string().max(50).optional().nullable(),
  nama: z.string().min(1).max(255).optional(),
  deskripsi: z.string().max(1000).optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  tipe: ProductTypeSchema.optional(),
  hargaBeli: z.string().optional().nullable(),
  hargaJual: z.string().min(1).optional(),
  unit: z.string().max(20).optional(),
  minStockLevel: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const ProductIdSchema = z.object({
  id: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      throw new Error('Invalid product ID format');
    }
    return parsed;
  }),
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
  tenantId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  categoryId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  tipe: ProductTypeSchema.optional(),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
export class ProductIdDto extends createZodDto(ProductIdSchema) {}
export class ProductQueryDto extends createZodDto(ProductQuerySchema) {}
