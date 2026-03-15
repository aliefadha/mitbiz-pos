import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { rolePermissions, roles, user } from '@/db/schema';
import type { DrizzleDB } from '@/db/type';
import { auth } from '@/lib/auth';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { BadRequestException, ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { CreateUserDto, UpdateUserDto } from './dto';

export interface UserRoleAndPermissions {
  role: {
    id: string;
    name: string;
    scope: 'global' | 'tenant';
  } | null;
  permissions: {
    id: string;
    roleId: string;
    resource: string;
    action: string;
  }[];
}

@Injectable()
export class UserService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async getAllUsers(currentUser: CurrentUserWithRole, tenantId?: string) {
    // If query tenantId provided, validate access
    if (tenantId) {
      await this.tenantAuth.validateQueryTenantId(currentUser, tenantId);
    }

    // Get effective tenant ID for the user
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(currentUser);

    // Global roles can see all users, optionally filtered by tenantId
    if (!effectiveTenantId) {
      const users = await this.db.query.user.findMany({
        where: tenantId ? eq(user.tenantId, tenantId) : undefined,
        with: {
          role: {
            columns: {
              id: true,
              name: true,
              scope: true,
              tenantId: true,
            },
          },
          tenant: {
            columns: {
              id: true,
              nama: true,
            },
          },
          outlet: {
            columns: {
              id: true,
              nama: true,
            },
          },
        },
      });
      return { users, total: users.length };
    }

    // Tenant-scoped roles can only see users in their tenant
    const filterTenantId = tenantId || effectiveTenantId;
    const users = await this.db.query.user.findMany({
      where: eq(user.tenantId, filterTenantId),
      with: {
        role: {
          columns: {
            id: true,
            name: true,
            scope: true,
            tenantId: true,
          },
        },
        tenant: {
          columns: {
            id: true,
            nama: true,
          },
        },
        outlet: {
          columns: {
            id: true,
            nama: true,
          },
        },
      },
    });
    return { users, total: users.length };
  }

  async findUserRoles(userId: string) {
    const userWithRole = await this.db
      .select({
        id: roles.id,
        name: roles.name,
        scope: roles.scope,
      })
      .from(user)
      .leftJoin(roles, eq(user.roleId, roles.id))
      .where(eq(user.id, userId))
      .limit(1);

    return userWithRole[0] || null;
  }

  async getUserRolesAndPermissions(userId: string): Promise<UserRoleAndPermissions> {
    const userWithRole = await this.db
      .select({
        id: roles.id,
        name: roles.name,
        scope: roles.scope,
      })
      .from(user)
      .leftJoin(roles, eq(user.roleId, roles.id))
      .where(eq(user.id, userId))
      .limit(1);

    const userRole = userWithRole[0];
    const role =
      userRole?.id && userRole?.name && userRole?.scope
        ? {
            id: userRole.id,
            name: userRole.name,
            scope: userRole.scope,
          }
        : null;

    let permissions: UserRoleAndPermissions['permissions'] = [];
    if (role?.id) {
      permissions = await this.db
        .select()
        .from(rolePermissions)
        .where(eq(rolePermissions.roleId, role.id));
    }

    return { role, permissions };
  }

  async createUser(data: CreateUserDto, currentUser: CurrentUserWithRole) {
    // Validate tenant access for creating user
    if (data.tenantId) {
      await this.tenantAuth.validateTenantOperation(currentUser, data.tenantId);
    }

    // Validate role exists
    if (data.roleId) {
      const [role] = await this.db.select().from(roles).where(eq(roles.id, data.roleId)).limit(1);

      if (!role) {
        throw new BadRequestException(`Role with ID '${data.roleId}' not found`);
      }
    }

    // Create user using better-auth
    const result = await auth.api.signUpEmail({
      body: {
        email: data.email,
        password: data.password,
        name: data.name,
      },
    });

    if (!result.user) {
      throw new BadRequestException('Failed to create user');
    }

    // Update user with additional fields
    await this.db
      .update(user)
      .set({
        roleId: data.roleId,
        tenantId: data.tenantId,
        outletId: data.outletId,
        isSubscribed: data.isSubscribed,
        emailVerified: true,
      })
      .where(eq(user.id, result.user.id));

    // Return created user with relations
    const createdUser = await this.db.query.user.findFirst({
      where: eq(user.id, result.user.id),
      with: {
        role: true,
        tenant: true,
        outlet: true,
      },
    });

    return createdUser;
  }

  async updateUser(id: string, data: UpdateUserDto, currentUser: CurrentUserWithRole) {
    // Check if user exists
    const existingUser = await this.db.query.user.findFirst({
      where: eq(user.id, id),
    });

    if (!existingUser) {
      throw new BadRequestException('User not found');
    }

    // Validate tenant access for updating user
    if (existingUser.tenantId) {
      await this.tenantAuth.validateTenantOperation(currentUser, existingUser.tenantId);
    }

    // Validate role exists if roleId is provided
    if (data.roleId) {
      const [role] = await this.db.select().from(roles).where(eq(roles.id, data.roleId)).limit(1);

      if (!role) {
        throw new BadRequestException(`Role with ID '${data.roleId}' not found`);
      }
    }

    // Update user
    await this.db
      .update(user)
      .set({
        name: data.name,
        email: data.email,
        roleId: data.roleId,
        outletId: data.outletId,
      })
      .where(eq(user.id, id));

    // Return updated user with relations
    const updatedUser = await this.db.query.user.findFirst({
      where: eq(user.id, id),
      with: {
        role: true,
        tenant: true,
        outlet: true,
      },
    });

    return updatedUser;
  }
}
