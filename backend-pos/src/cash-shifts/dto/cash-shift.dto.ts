import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CashShiftStatusSchema = z.enum(['buka', 'tutup']);

export const CreateCashShiftSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  outletId: z.string().min(1, 'Outlet ID is required'),
  cashierId: z.string().optional(),
  jumlahBuka: z.string().optional().default('0'),
  status: CashShiftStatusSchema.default('buka'),
  catatan: z.string().optional().nullable(),
});

export const UpdateCashShiftSchema = z.object({
  jumlahTutup: z.string().optional(),
  jumlahExpected: z.string().optional(),
  selisih: z.string().optional(),
  status: CashShiftStatusSchema.optional(),
  waktuTutup: z.string().optional(),
  catatan: z.string().optional().nullable(),
});

export const CashShiftIdSchema = z.object({
  id: z.string().min(1, 'Cash Shift ID is required'),
});

export const CashShiftQuerySchema = z.object({
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
  status: CashShiftStatusSchema.optional(),
  tenantId: z.string().min(1).optional(),
  outletId: z.string().min(1).optional(),
  cashierId: z.string().min(1).optional(),
});

export class CreateCashShiftDto extends createZodDto(CreateCashShiftSchema) {}
export class UpdateCashShiftDto extends createZodDto(UpdateCashShiftSchema) {}
export class CashShiftIdDto extends createZodDto(CashShiftIdSchema) {}
export class CashShiftQueryDto extends createZodDto(CashShiftQuerySchema) {}
