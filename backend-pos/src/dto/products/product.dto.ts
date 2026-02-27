import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * Product DTOs for validation
 * Used in POS system for managing products
 */

// Product creation schema
export const CreateProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  price: z.number().positive('Price must be a positive number').max(999999999, 'Price is too high'),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU must be less than 100 characters'),
  categoryId: z.string().uuid('Invalid category ID format').optional(),
  stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative').default(0),
  isActive: z.boolean().default(true),
  imageUrl: z.string().url('Invalid image URL').optional(),
});

// Product update schema
export const UpdateProductSchema = z.object({
  name: z
    .string()
    .min(1, 'Product name is required')
    .max(255, 'Product name must be less than 255 characters')
    .optional(),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  price: z
    .number()
    .positive('Price must be a positive number')
    .max(999999999, 'Price is too high')
    .optional(),
  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(100, 'SKU must be less than 100 characters')
    .optional(),
  categoryId: z.string().uuid('Invalid category ID format').optional().nullable(),
  stock: z.number().int('Stock must be an integer').min(0, 'Stock cannot be negative').optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().url('Invalid image URL').optional().nullable(),
});

// Product ID parameter schema
export const ProductIdSchema = z.object({
  id: z.string().uuid('Invalid product ID format'),
});

// Product query params for filtering/pagination
export const ProductQuerySchema = z.object({
  page: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 ? 1 : parsed;
  }),
  limit: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    return isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 100);
  }),
  search: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID format').optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

// DTO Classes for Swagger/OpenAPI support
export class CreateProductDto extends createZodDto(CreateProductSchema) {}
export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
export class ProductIdDto extends createZodDto(ProductIdSchema) {}
export class ProductQueryDto extends createZodDto(ProductQuerySchema) {}
