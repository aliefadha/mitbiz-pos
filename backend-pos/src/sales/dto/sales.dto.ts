import { z } from 'zod';

export const SalesQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  outletId: z.string().optional(),
  tenantId: z.string().optional(),
  limit: z.coerce.number().optional(),
});

export type SalesQueryDto = z.infer<typeof SalesQuerySchema>;
