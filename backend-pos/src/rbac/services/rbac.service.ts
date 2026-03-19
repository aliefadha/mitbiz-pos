import { db } from '@/db';
import { outlets, rolePermissions, roles } from '@/db/schema';
import { Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';
import { Action, Resource, RoleWithPermissions, ScopeType } from '../types/rbac.types';

@Injectable()
export class RbacService {
  async getRoleWithPermissions(roleId: string): Promise<RoleWithPermissions | null> {
    const [role] = await db.select().from(roles).where(eq(roles.id, roleId)).limit(1);

    if (!role || !role.isActive) {
      return null;
    }

    const permissions = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    const groupedPermissions = permissions.reduce(
      (acc, perm) => {
        const existing = acc.find((p) => p.resource === perm.resource);
        if (existing) {
          existing.actions.push(perm.action as Action);
        } else {
          acc.push({ resource: perm.resource, actions: [perm.action as Action] });
        }
        return acc;
      },
      [] as { resource: string; actions: Action[] }[],
    );

    return {
      id: role.id,
      name: role.name,
      scope: role.scope as ScopeType,
      tenantId: role.tenantId,
      isActive: role.isActive,
      proFeatureId: role.proFeatureId,
      permissions: groupedPermissions,
    };
  }

  async getRolePermissions(roleId: string): Promise<{ resource: string; actions: Action[] }[]> {
    const permissions = await db
      .select()
      .from(rolePermissions)
      .where(eq(rolePermissions.roleId, roleId));

    return permissions.reduce(
      (acc, perm) => {
        const existing = acc.find((p) => p.resource === perm.resource);
        if (existing) {
          existing.actions.push(perm.action as Action);
        } else {
          acc.push({ resource: perm.resource, actions: [perm.action as Action] });
        }
        return acc;
      },
      [] as { resource: string; actions: Action[] }[],
    );
  }

  hasPermission(
    permissions: { resource: string; actions: Action[] }[],
    resource: Resource | string,
    action: Action,
  ): boolean {
    const permission = permissions.find(
      (p) => p.resource === resource || p.resource === resource.toLowerCase(),
    );
    if (!permission) {
      return false;
    }
    return permission.actions.includes(action);
  }

  async getDefaultRole(tenantId?: string): Promise<string | null> {
    const [role] = await db
      .select()
      .from(roles)
      .where(
        and(
          eq(roles.isDefault, true),
          tenantId ? eq(roles.tenantId, tenantId) : eq(roles.scope, ScopeType.GLOBAL),
        ),
      )
      .limit(1);

    return role?.id || null;
  }

  async getUserTenantId(outletId: string | null): Promise<string | null> {
    if (!outletId) return null;

    const [outlet] = await db.select().from(outlets).where(eq(outlets.id, outletId)).limit(1);

    return outlet?.tenantId || null;
  }
}
