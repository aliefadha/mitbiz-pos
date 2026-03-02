import { DB_CONNECTION } from '@/db/db.module';
import { roles, user } from '@/db/schema';
import { tenants } from '@/db/schema/tenant-schema';
import type { DrizzleDB } from '@/db/type';
import { auth } from '@/lib/auth';
import { Inject, Injectable, ForbiddenException, BadRequestException } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import type { CreateUserDto } from './dto';

@Injectable()
export class UserService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async getAllUsers(currentUserId: string, tenantId?: string) {
    // First check if user is admin
    const userRole = await this.findUserRoles(currentUserId);
    const isAdmin = userRole?.name === 'admin';

    if (isAdmin) {
      // Admin sees all users, optionally filtered by tenantId
      const users = await this.db.query.user.findMany({
        where: tenantId ? eq(user.tenantId, tenantId) : undefined,
        with: {
          role: true,
          tenant: true,
          outlet: true,
        },
      });
      return { users, total: users.length };
    }

    // Non-admin users: check tenant ownership
    const ownedTenants = await this.db.query.tenants.findMany({
      where: eq(tenants.userId, currentUserId),
    });

    if (ownedTenants.length === 0) {
      return { users: [], total: 0 };
    }

    const ownedTenantIds = ownedTenants.map((t) => t.id);

    // If tenantId is provided, verify ownership
    if (tenantId) {
      if (!ownedTenantIds.includes(tenantId)) {
        return { users: [], total: 0 };
      }

      const users = await this.db.query.user.findMany({
        where: eq(user.tenantId, tenantId),
        with: {
          role: true,
          tenant: true,
          outlet: true,
        },
      });
      return { users, total: users.length };
    }

    // No tenantId provided, return users from all owned tenants
    const users = await this.db.query.user.findMany({
      where: (user, { inArray }) => inArray(user.tenantId, ownedTenantIds),
      with: {
        role: true,
        tenant: true,
        outlet: true,
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

  async createUser(data: CreateUserDto, currentUserId: string) {
    // Check current user's role
    const creatorRole = await this.findUserRoles(currentUserId);
    const isAdmin = creatorRole?.name === 'admin';

    // If not admin, verify they own the target tenant
    if (!isAdmin && data.tenantId) {
      const ownedTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, currentUserId),
      });

      const ownedTenantIds = ownedTenants.map((t) => t.id);
      if (!ownedTenantIds.includes(data.tenantId)) {
        throw new ForbiddenException('You do not have permission to create users in this tenant');
      }
    }

    // Get role ID from role name
    let roleId: string | undefined;
    if (data.role) {
      const [role] = await this.db.select().from(roles).where(eq(roles.name, data.role)).limit(1);

      if (!role) {
        throw new BadRequestException(`Role '${data.role}' not found`);
      }
      roleId = role.id;
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
        roleId,
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
}
