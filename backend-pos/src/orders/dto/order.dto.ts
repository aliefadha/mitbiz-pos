import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const OrderStatusSchema = z.enum(['complete', 'cancel', 'refunded']);

export const CreateOrderItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  hargaSatuan: z.string().min(1, 'Unit price is required'),
  jumlahDiskon: z.string().optional().default('0'),
  total: z.string().min(1, 'Total price is required'),
});

export const TaxBreakdownSchema = z.object({
  taxId: z.string(),
  nama: z.string(),
  rate: z.string(),
  amount: z.number(),
});

export const DiscountBreakdownSchema = z.object({
  discountId: z.string(),
  nama: z.string(),
  rate: z.string(),
  amount: z.number(),
});

export const CreateOrderSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  outletId: z.string().min(1, 'Outlet ID is required'),
  orderNumber: z.string().min(1, 'Order number is required'),
  status: OrderStatusSchema.default('complete'),
  subtotal: z.string().optional().default('0'),
  jumlahPajak: z.string().optional().default('0'),
  pajakBreakdown: z.array(TaxBreakdownSchema).optional(),
  jumlahDiskon: z.string().optional().default('0'),
  diskonBreakdown: z.array(DiscountBreakdownSchema).optional(),
  paymentMethodId: z.string().optional().nullable(),
  total: z.string().optional().default('0'),
  notes: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
  items: z.array(CreateOrderItemSchema).optional(),
});

export const UpdateOrderSchema = z.object({
  outletId: z.string().min(1).optional(),
  orderNumber: z.string().min(1).optional(),
  status: OrderStatusSchema.optional(),
  subtotal: z.string().optional(),
  jumlahPajak: z.string().optional(),
  pajakBreakdown: z.array(TaxBreakdownSchema).optional(),
  jumlahDiskon: z.string().optional(),
  diskonBreakdown: z.array(DiscountBreakdownSchema).optional(),
  paymentMethodId: z.string().optional().nullable(),
  total: z.string().optional(),
  notes: z.string().optional().nullable(),
  completedAt: z.string().optional().nullable(),
});

export const OrderIdSchema = z.object({
  id: z.string().min(1, 'Order ID is required'),
});

export const OrderQuerySchema = z.object({
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
  status: OrderStatusSchema.optional(),
  tenantId: z.string().min(1).optional(),
  outletId: z.string().min(1).optional(),
});

export class CreateOrderDto extends createZodDto(CreateOrderSchema) {}
export class UpdateOrderDto extends createZodDto(UpdateOrderSchema) {}
export class OrderIdDto extends createZodDto(OrderIdSchema) {}
export class OrderQueryDto extends createZodDto(OrderQuerySchema) {}
