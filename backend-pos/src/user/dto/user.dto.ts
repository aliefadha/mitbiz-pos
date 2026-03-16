import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  roleId: z.string().min(1, 'Role ID is required'),
  outletId: z.string().min(1, 'Invalid outlet ID').optional(),
  tenantId: z.string().min(1, 'Invalid tenant ID').optional(),
  isSubscribed: z.boolean().default(false),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}

export const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Invalid email address').optional(),
  roleId: z.string().min(1, 'Role ID is required').optional(),
  outletId: z.string().min(1, 'Invalid outlet ID').optional().nullable(),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

export const UserQuerySchema = z.object({
  tenantId: z.string().optional(),
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

export class UserQueryDto extends createZodDto(UserQuerySchema) {}
