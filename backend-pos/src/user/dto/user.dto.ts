import { z } from 'zod';
import { createZodDto } from 'nestjs-zod';

export const CreateUserSchema = z
  .object({
    email: z.string().email('Invalid email address'),
    name: z.string().min(1, 'Name is required'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['admin', 'owner', 'cashier']).default('cashier'),
    outletId: z.string().min(1, 'Invalid outlet ID').optional(),
    isSubscribed: z.boolean().default(false),
  })
  .refine(
    (data) => {
      if (data.role === 'cashier' && !data.outletId) {
        return false;
      }
      return true;
    },
    {
      message: 'outletId is required for cashier role',
      path: ['outletId'],
    },
  );

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
