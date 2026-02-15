import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateStockSchema = z.object({
  productId: z.number().int().positive('Product ID is required'),
  outletId: z.number().int().positive('Outlet ID is required'),
  quantity: z.number().int().min(0).default(0),
});

export const UpdateStockSchema = z.object({
  quantity: z.number().int().min(0),
});

export const StockIdSchema = z.object({
  id: z.string().transform((val) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed) || parsed < 1) {
      throw new Error('Invalid stock ID format');
    }
    return parsed;
  }),
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
  productId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
  outletId: z
    .string()
    .transform((val) => parseInt(val, 10))
    .optional(),
});

export class CreateStockDto extends createZodDto(CreateStockSchema) {}
export class UpdateStockDto extends createZodDto(UpdateStockSchema) {}
export class StockIdDto extends createZodDto(StockIdSchema) {}
export class StockQueryDto extends createZodDto(StockQuerySchema) {}
