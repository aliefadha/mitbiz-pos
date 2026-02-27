import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

/**
 * Tenant DTOs for validation
 * Used for managing tenant/business entities in POS system
 */

// Settings schema for tenant
const TenantSettingsSchema = z.object({
  currency: z.string().default('IDR'),
  timezone: z.string().default('Asia/Jakarta'),
  taxRate: z.number().min(0).max(100).default(0),
  receiptFooter: z.string().optional(),
});

// Tenant creation schema
export const CreateTenantSchema = z.object({
  nama: z
    .string()
    .min(1, 'Tenant name is required')
    .max(255, 'Tenant name must be less than 255 characters'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  userId: z.string().min(1, 'User ID is required').optional(),
  settings: TenantSettingsSchema.optional(),
  image: z.string().url('Invalid image URL').optional().nullable(),
  alamat: z.string().max(500, 'Address must be less than 500 characters').optional().nullable(),
  noHp: z.string().max(20, 'Phone number must be less than 20 characters').optional().nullable(),
  isActive: z.boolean().default(true),
});

// Tenant update schema
export const UpdateTenantSchema = z.object({
  nama: z
    .string()
    .min(1, 'Tenant name is required')
    .max(255, 'Tenant name must be less than 255 characters')
    .optional(),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
    .optional(),
  settings: TenantSettingsSchema.optional(),
  image: z.string().url('Invalid image URL').optional().nullable(),
  alamat: z.string().max(500, 'Address must be less than 500 characters').optional().nullable(),
  noHp: z.string().max(20, 'Phone number must be less than 20 characters').optional().nullable(),
  isActive: z.boolean().optional(),
});

// Tenant ID parameter schema
export const TenantIdSchema = z.object({
  id: z.string().min(1, 'Tenant ID is required'),
});

// Tenant slug parameter schema
export const TenantSlugSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
});

// Tenant query params for filtering/pagination
export const TenantQuerySchema = z.object({
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
  userId: z.string().optional(),
});

// DTO Classes for Swagger/OpenAPI support
export class CreateTenantDto extends createZodDto(CreateTenantSchema) {}
export class UpdateTenantDto extends createZodDto(UpdateTenantSchema) {}
export class TenantIdDto extends createZodDto(TenantIdSchema) {}
export class TenantSlugDto extends createZodDto(TenantSlugSchema) {}
export class TenantQueryDto extends createZodDto(TenantQuerySchema) {}

// Type exports for TypeScript (backward compatibility)
export type TenantSettingsDto = z.infer<typeof TenantSettingsSchema>;

export const TenantSummarySchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
});

export class TenantSummaryDto extends createZodDto(TenantSummarySchema) {}
