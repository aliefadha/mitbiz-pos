import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateSnapTransactionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
});

export class CreateSnapTransactionDto extends createZodDto(CreateSnapTransactionSchema) {}
