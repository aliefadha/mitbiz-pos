import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const BillingCycleSchema = z.enum(['monthly', 'quarterly', 'yearly']);
export type BillingCycle = z.infer<typeof BillingCycleSchema>;

export const CreateSubscriptionPlanSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  billingCycle: BillingCycleSchema,
  price: z.string().min(1, 'Price is required'),
  isActive: z.boolean().default(true),
  proFeatureIds: z.array(z.string()).optional(),
});

export const UpdateSubscriptionPlanSchema = CreateSubscriptionPlanSchema.partial();

export const SubscriptionPlanIdSchema = z.object({
  id: z.string().min(1, 'Plan ID is required'),
});

export const SubscriptionStatusSchema = z.enum(['active', 'expired', 'cancelled', 'suspended']);

export const CreateSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  // TODO: Add payment integration fields
  // paymentMethodId: z.string().uuid().optional(),
  // paymentProof: z.string().optional(),
});

export const RenewSubscriptionSchema = z.object({
  billingCycle: BillingCycleSchema.optional(),
  // TODO: Add payment integration fields
  // paymentMethodId: z.string().uuid().optional(),
  // paymentProof: z.string().optional(),
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
  billingCycle: BillingCycleSchema.optional(),
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

export const ManagePlanResourceSchema = z.object({
  resourceId: z.string().min(1, 'Resource ID is required'),
  isIncluded: z.boolean().default(true),
});

export const BulkManagePlanResourcesSchema = z.object({
  resources: z
    .array(
      z.object({
        resourceId: z.string().min(1, 'Resource ID is required'),
        isIncluded: z.boolean().default(true),
      }),
    )
    .min(1, 'At least one resource is required'),
});

export class ManagePlanResourceDto extends createZodDto(ManagePlanResourceSchema) {}
export class BulkManagePlanResourcesDto extends createZodDto(BulkManagePlanResourcesSchema) {}

export const ManagePlanProFeatureSchema = z.object({
  proFeatureId: z.string().min(1, 'Pro Feature ID is required'),
});

export const BulkManagePlanProFeaturesSchema = z.object({
  proFeatures: z
    .array(
      z.object({
        proFeatureId: z.string().min(1, 'Pro Feature ID is required'),
        isIncluded: z.boolean().default(true),
      }),
    )
    .min(1, 'At least one pro feature is required'),
});

export class ManagePlanProFeatureDto extends createZodDto(ManagePlanProFeatureSchema) {}
export class BulkManagePlanProFeaturesDto extends createZodDto(BulkManagePlanProFeaturesSchema) {}

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
