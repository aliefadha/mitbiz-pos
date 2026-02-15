import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateStockAdjustmentSchema = z.object({
  outletId: z.number().int().positive('Outlet ID is required'),
  productId: z.number().int().positive('Product ID is required'),
  quantity: z.number().int('Quantity must be an integer'),
  alasan: z.string().max(500).optional().nullable(),
  adjustedBy: z.string().min(1, 'User ID is required'),
});

export const StockAdjustmentQuerySchema = z.object({
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
  productId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  outletId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  adjustedBy: z.string().optional(),
});

export class CreateStockAdjustmentDto extends createZodDto(CreateStockAdjustmentSchema) {}
export class StockAdjustmentQueryDto extends createZodDto(StockAdjustmentQuerySchema) {}
