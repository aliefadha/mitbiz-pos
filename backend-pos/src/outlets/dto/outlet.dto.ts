import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateOutletSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  nama: z.string().min(1, 'Outlet name is required').max(255),
  kode: z.string().min(1, 'Outlet code is required').max(50),
  alamat: z.string().max(500).optional().nullable(),
  noHp: z.string().max(20).optional().nullable(),
  isActive: z.boolean().default(true),
});

export const UpdateOutletSchema = z.object({
  nama: z.string().min(1).max(255).optional(),
  kode: z.string().min(1).max(50).optional(),
  alamat: z.string().max(500).optional().nullable(),
  noHp: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional(),
});

export const OutletIdSchema = z.object({
  id: z.string().min(1, 'Outlet ID is required'),
});

export const OutletQuerySchema = z.object({
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

export class CreateOutletDto extends createZodDto(CreateOutletSchema) {}
export class UpdateOutletDto extends createZodDto(UpdateOutletSchema) {}
export class OutletIdDto extends createZodDto(OutletIdSchema) {}
export class OutletQueryDto extends createZodDto(OutletQuerySchema) {}
