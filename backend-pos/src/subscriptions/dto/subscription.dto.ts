import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BillingCycleSchema = z.enum(['monthly', 'quarterly', 'semi_annual', 'yearly']);
export type BillingCycle = z.infer<typeof BillingCycleSchema>;

export const BillingCyclePriceSchema = z.object({
  billingCycle: BillingCycleSchema,
  price: z.string().min(1, 'Price is required'),
});

export const CreateSubscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  isActive: z.boolean().default(true),
  billingCycles: z.array(BillingCyclePriceSchema).min(1, 'At least one billing cycle is required'),
});

export const UpdateSubscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  isActive: z.boolean().optional(),
  billingCycles: z
    .array(BillingCyclePriceSchema)
    .min(1, 'At least one billing cycle is required')
    .optional(),
});

export const SubscriptionPlanIdSchema = z.object({
  id: z.string().min(1, 'Plan ID is required'),
});

export const SubscriptionStatusSchema = z.enum(['active', 'expired', 'cancelled', 'suspended']);

export const CreateSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  billingCycle: BillingCycleSchema,
});

export const RenewSubscriptionSchema = z.object({
  billingCycle: BillingCycleSchema,
});

export const SubscriptionSlugSchema = z.object({
  slug: z.string().min(1, 'Slug is required'),
});

export const SubscriptionIdSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
});

export const SubscriptionPlanQuerySchema = z.object({
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
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
});

export class CreateSubscriptionPlanDto extends createZodDto(CreateSubscriptionPlanSchema) {}
export class UpdateSubscriptionPlanDto extends createZodDto(UpdateSubscriptionPlanSchema) {}
export class SubscriptionPlanIdDto extends createZodDto(SubscriptionPlanIdSchema) {}
export class CreateSubscriptionDto extends createZodDto(CreateSubscriptionSchema) {}
export class RenewSubscriptionDto extends createZodDto(RenewSubscriptionSchema) {}
export class SubscriptionSlugDto extends createZodDto(SubscriptionSlugSchema) {}
export class SubscriptionIdDto extends createZodDto(SubscriptionIdSchema) {}
export const SubscriptionActionSchema = z.enum(['subscribed', 'renewed', 'changed', 'cancelled']);

export const SubscriptionHistoryQuerySchema = z.object({
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
  action: SubscriptionActionSchema.optional(),
  tenantId: z.string().optional(),
});

export class SubscriptionPlanQueryDto extends createZodDto(SubscriptionPlanQuerySchema) {}
export class SubscriptionHistoryQueryDto extends createZodDto(SubscriptionHistoryQuerySchema) {}
