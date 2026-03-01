import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateTaxSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  outletId: z.string().min(1).optional().nullable(),
  nama: z.string().min(1, 'Tax name is required').max(255),
  rate: z.string().min(1, 'Tax rate is required'),
  isGlobal: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export const UpdateTaxSchema = z.object({
  outletId: z.string().min(1).optional().nullable(),
  nama: z.string().min(1).max(255).optional(),
  rate: z.string().min(1).optional(),
  isGlobal: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const TaxIdSchema = z.object({
  id: z.string().min(1, 'Tax ID is required'),
});

export const TaxQuerySchema = z.object({
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
  outletId: z.string().min(1).optional(),
});

export class CreateTaxDto extends createZodDto(CreateTaxSchema) {}
export class UpdateTaxDto extends createZodDto(UpdateTaxSchema) {}
export class TaxIdDto extends createZodDto(TaxIdSchema) {}
export class TaxQueryDto extends createZodDto(TaxQuerySchema) {}
