import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateCategorySchema = z.object({
  tenantId: z.number().int().positive('Tenant ID is required'),
  nama: z.string().min(1, 'Category name is required').max(255),
  deskripsi: z.string().max(500).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const UpdateCategorySchema = z.object({
  nama: z.string().min(1).max(255).optional(),
  deskripsi: z.string().max(500).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const CategoryIdSchema = z.object({
  id: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      throw new Error('Invalid category ID format');
    }
    return parsed;
  }),
});

export const CategoryQuerySchema = z.object({
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
});

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}
export class UpdateCategoryDto extends createZodDto(UpdateCategorySchema) {}
export class CategoryIdDto extends createZodDto(CategoryIdSchema) {}
export class CategoryQueryDto extends createZodDto(CategoryQuerySchema) {}
