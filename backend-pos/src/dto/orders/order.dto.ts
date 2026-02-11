import { z } from 'zod';

/**
 * Order DTOs for validation
 * Used in POS system for managing orders
 */

// Payment method enum
const PaymentMethodEnum = z.enum(['cash', 'card', 'digital_wallet', 'bank_transfer']);

// Order status enum
const OrderStatusEnum = z.enum(['pending', 'processing', 'completed', 'cancelled', 'refunded']);

// Payment status enum
const PaymentStatusEnum = z.enum(['pending', 'paid', 'failed', 'refunded']);

// Order item schema (nested in order)
export const OrderItemSchema = z.object({
  productId: z.string().uuid('Invalid product ID format'),
  quantity: z
    .number()
    .int('Quantity must be an integer')
    .positive('Quantity must be at least 1'),
  unitPrice: z
    .number()
    .positive('Unit price must be a positive number'),
  discount: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .default(0),
});

// Order creation schema
export const CreateOrderSchema = z.object({
  customerId: z
    .string()
    .uuid('Invalid customer ID format')
    .optional(),
  items: z
    .array(OrderItemSchema)
    .min(1, 'Order must have at least one item'),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
  paymentMethod: PaymentMethodEnum,
  discountAmount: z
    .number()
    .min(0, 'Discount amount cannot be negative')
    .default(0),
  taxAmount: z
    .number()
    .min(0, 'Tax amount cannot be negative')
    .default(0),
});

// Order update schema (for status updates, etc.)
export const UpdateOrderSchema = z.object({
  status: OrderStatusEnum.optional(),
  notes: z
    .string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
  paymentStatus: PaymentStatusEnum.optional(),
});

// Order ID parameter schema
export const OrderIdSchema = z.object({
  id: z.string().uuid('Invalid order ID format'),
});

// Order query params for filtering/pagination
export const OrderQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 1 : parsed;
    }),
  limit: z
    .string()
    .transform((val) => {
      const parsed = parseInt(val, 10);
      return isNaN(parsed) || parsed < 1 ? 10 : Math.min(parsed, 100);
    }),
  status: OrderStatusEnum.optional(),
  customerId: z.string().uuid('Invalid customer ID format').optional(),
  startDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
});

// Order status update parameter
export const OrderStatusParamSchema = z.object({
  id: z.string().uuid('Invalid order ID format'),
  status: OrderStatusEnum,
});

// Type exports for TypeScript
export type CreateOrderDto = z.infer<typeof CreateOrderSchema>;
export type UpdateOrderDto = z.infer<typeof UpdateOrderSchema>;
export type OrderIdDto = z.infer<typeof OrderIdSchema>;
export type OrderQueryDto = z.infer<typeof OrderQuerySchema>;
export type OrderItemDto = z.infer<typeof OrderItemSchema>;
export type OrderStatusParamDto = z.infer<typeof OrderStatusParamSchema>;
