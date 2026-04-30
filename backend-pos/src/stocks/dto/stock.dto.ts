import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateStockSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  outletId: z.string().min(1, 'Outlet ID is required'),
  quantity: z.number().int().min(0).default(0),
});

export const UpdateStockSchema = z.object({
  quantity: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export const StockIdSchema = z.object({
  id: z.string().min(1, 'Stock ID is required'),
});

export const StockQuerySchema = z.object({
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
  productId: z.string().min(1).optional(),
  outletId: z.string().min(1).optional(),
  tenantId: z.string().min(1).optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export class CreateStockDto extends createZodDto(CreateStockSchema) {}
export class UpdateStockDto extends createZodDto(UpdateStockSchema) {}
export class StockIdDto extends createZodDto(StockIdSchema) {}
export class StockQueryDto extends createZodDto(StockQuerySchema) {}
