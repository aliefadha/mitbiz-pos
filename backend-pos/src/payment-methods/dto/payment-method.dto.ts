import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreatePaymentMethodSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  nama: z.string().min(1, 'Payment method name is required').max(255),
  isActive: z.boolean().default(true),
});

export const UpdatePaymentMethodSchema = z.object({
  nama: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
});

export const PaymentMethodIdSchema = z.object({
  id: z.string().min(1, 'Payment method ID is required'),
});

export const PaymentMethodQuerySchema = z.object({
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
});

export class CreatePaymentMethodDto extends createZodDto(CreatePaymentMethodSchema) {}
export class UpdatePaymentMethodDto extends createZodDto(UpdatePaymentMethodSchema) {}
export class PaymentMethodIdDto extends createZodDto(PaymentMethodIdSchema) {}
export class PaymentMethodQueryDto extends createZodDto(PaymentMethodQuerySchema) {}
