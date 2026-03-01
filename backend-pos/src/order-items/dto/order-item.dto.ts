import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateOrderItemSchema = z.object({
  outletId: z.string().min(1, 'Outlet ID is required'),
  orderId: z.string().min(1, 'Order ID is required'),
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  hargaSatuan: z.string().min(1, 'Unit price is required'),
  jumlahDiskon: z.string().optional().default('0'),
  total: z.string().min(1, 'Total price is required'),
});

export const UpdateOrderItemSchema = z.object({
  productId: z.string().min(1).optional(),
  quantity: z.number().int().min(1).optional(),
  hargaSatuan: z.string().min(1).optional(),
  jumlahDiskon: z.string().optional(),
  total: z.string().min(1).optional(),
});

export const OrderItemIdSchema = z.object({
  id: z.string().min(1, 'Order item ID is required'),
});

export const OrderItemQuerySchema = z.object({
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
  orderId: z.string().min(1).optional(),
  productId: z.string().min(1).optional(),
  outletId: z.string().min(1).optional(),
});

export class CreateOrderItemDto extends createZodDto(CreateOrderItemSchema) {}
export class UpdateOrderItemDto extends createZodDto(UpdateOrderItemSchema) {}
export class OrderItemIdDto extends createZodDto(OrderItemIdSchema) {}
export class OrderItemQueryDto extends createZodDto(OrderItemQuerySchema) {}
