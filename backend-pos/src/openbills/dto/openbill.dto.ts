import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const DiscountBreakdownSchema = z.object({
  discountId: z.string(),
  nama: z.string(),
  rate: z.string(),
  amount: z.number(),
});

export const CreateOpenBillItemSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  hargaSatuan: z.string().min(1, 'Unit price is required'),
  jumlahDiskon: z.string().optional().default('0'),
  total: z.string().min(1, 'Total price is required'),
});

export const CreateOpenBillSchema = z.object({
  tenantId: z.string().min(1, 'Tenant ID is required'),
  outletId: z.string().min(1, 'Outlet ID is required'),
  notes: z.string().optional().nullable(),
  nomorAntrian: z.string().min(1, 'Nomor antrian is required'),
  items: z.array(CreateOpenBillItemSchema).optional(),
});

export const AddItemToOpenBillSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  hargaSatuan: z.string().min(1, 'Unit price is required'),
  jumlahDiskon: z.string().optional().default('0'),
  total: z.string().min(1, 'Total price is required'),
});

export const UpdateOpenBillSchema = z.object({
  notes: z.string().optional().nullable(),
  nomorAntrian: z.string().optional().nullable(),
});

export const ReplaceOpenBillItemsSchema = z.object({
  items: z.array(CreateOpenBillItemSchema),
});

export const CloseOpenBillSchema = z.object({
  paymentMethodId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  subtotal: z.string().optional().default('0'),
  jumlahPajak: z.string().optional().default('0'),
  jumlahDiskon: z.string().optional().default('0'),
  diskonBreakdown: z.array(DiscountBreakdownSchema).optional(),
  total: z.string().optional().default('0'),
});

export const OpenBillQuerySchema = z.object({
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
  tenantId: z.string().min(1).optional(),
  outletId: z.string().min(1).optional(),
});

export const OpenBillIdSchema = z.object({
  id: z.string().min(1, 'Open bill ID is required'),
});

export class CreateOpenBillDto extends createZodDto(CreateOpenBillSchema) {}
export class AddItemToOpenBillDto extends createZodDto(AddItemToOpenBillSchema) {}
export class UpdateOpenBillDto extends createZodDto(UpdateOpenBillSchema) {}
export class ReplaceOpenBillItemsDto extends createZodDto(ReplaceOpenBillItemsSchema) {}
export class CloseOpenBillDto extends createZodDto(CloseOpenBillSchema) {}
export class OpenBillQueryDto extends createZodDto(OpenBillQuerySchema) {}
export class OpenBillIdDto extends createZodDto(OpenBillIdSchema) {}
