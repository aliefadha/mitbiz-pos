import { ScopeType } from '@/rbac/types/rbac.types';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CreateRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(255, 'Role name must be less than 255 characters'),
  scope: z.nativeEnum(ScopeType),
  tenantId: z.string().optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isDefault: z.boolean().default(false),
});

export const UpdateRoleSchema = z.object({
  name: z
    .string()
    .min(1, 'Role name is required')
    .max(255, 'Role name must be less than 255 characters')
    .optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isActive: z.boolean().optional(),
  isDefault: z.boolean().optional(),
});

export const RoleIdSchema = z.object({
  id: z.string().min(1, 'Role ID is required'),
});

export const RoleQuerySchema = z.object({
  tenantId: z.string().optional(),
  scope: z.enum(ScopeType).optional(),
  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
});

export const PermissionSchema = z.object({
  resource: z.string().min(1, 'Resource is required'),
  action: z.string().min(1, 'Action is required'),
});

export const SetPermissionsSchema = z.object({
  permissions: z.array(PermissionSchema).min(1, 'At least one permission is required'),
});

export const CreateResourceSchema = z.object({
  name: z
    .string()
    .min(1, 'Resource name is required')
    .max(255, 'Resource name must be less than 255 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

export const UpdateResourceSchema = z.object({
  name: z
    .string()
    .min(1, 'Resource name is required')
    .max(255, 'Resource name must be less than 255 characters')
    .optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  isActive: z.boolean().optional(),
});

export const ResourceIdSchema = z.object({
  id: z.string().min(1, 'Resource ID is required'),
});

export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
export class UpdateRoleDto extends createZodDto(UpdateRoleSchema) {}
export class RoleIdDto extends createZodDto(RoleIdSchema) {}
export class RoleQueryDto extends createZodDto(RoleQuerySchema) {}
export class PermissionDto extends createZodDto(PermissionSchema) {}
export class SetPermissionsDto extends createZodDto(SetPermissionsSchema) {}
export class CreateResourceDto extends createZodDto(CreateResourceSchema) {}
export class UpdateResourceDto extends createZodDto(UpdateResourceSchema) {}
export class ResourceIdDto extends createZodDto(ResourceIdSchema) {}
