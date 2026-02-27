import { z } from 'zod';

export const DashboardQuerySchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  outletId: z.string().optional(),
  tenantId: z.string().optional(),
});

export type DashboardQueryDto = z.infer<typeof DashboardQuerySchema>;
