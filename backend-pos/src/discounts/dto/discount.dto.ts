import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const discountScope = z.enum(['product', 'transaction']);

export const discountLevel = z.enum(['tenant', 'outlet']);

export const CreateDiscountSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  outletId: z.string().min(1).optional().nullable(),
  productIds: z.array(z.string().min(1)).optional(),
  nama: z.string().min(1, 'Discount name is required').max(255),
  rate: z.string().min(1, 'Discount rate is required'),
  scope: discountScope.default('transaction'),
  level: discountLevel.default('tenant'),
  isActive: z.boolean().default(true),
});

export const UpdateDiscountSchema = z.object({
  outletId: z.string().min(1).optional().nullable(),
  productIds: z.array(z.string().min(1)).optional(),
  nama: z.string().min(1).max(255).optional(),
  rate: z.string().min(1).optional(),
  scope: discountScope.optional(),
  level: discountLevel.optional(),
  isActive: z.boolean().optional(),
});

export const DiscountIdSchema = z.object({
  id: z.string().min(1, 'Discount ID is required'),
});

export const DiscountQuerySchema = z.object({
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
  outletId: z.string().min(1).optional(),
});

export class CreateDiscountDto extends createZodDto(CreateDiscountSchema) {}
export class UpdateDiscountDto extends createZodDto(UpdateDiscountSchema) {}
export class DiscountIdDto extends createZodDto(DiscountIdSchema) {}
export class DiscountQueryDto extends createZodDto(DiscountQuerySchema) {}
