import { DB_CONNECTION } from '@/db/db.module';
import { resources, rolePermissions, roles } from '@/db/schema';
import type { DrizzleDB } from '@/db/type';
import { ScopeType } from '@/rbac/types/rbac.types';
import { Inject, Injectable } from '@nestjs/common';
import { and, eq } from 'drizzle-orm';

@Injectable()
export class RolesService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}
  // ============ ROLES ============

  async findAll(tenantId?: string) {
    if (tenantId) {
      return this.db.select().from(roles).where(eq(roles.tenantId, tenantId));
    }
    return this.db.select().from(roles).where(eq(roles.scope, ScopeType.GLOBAL));
  }

  async findById(id: string) {
    const [role] = await this.db.select().from(roles).where(eq(roles.id, id)).limit(1);
    return role;
  }

  async findByName(name: string, tenantId?: string) {
    const conditions = [eq(roles.name, name)];
    if (tenantId) {
      conditions.push(eq(roles.tenantId, tenantId));
    } else {
      conditions.push(eq(roles.scope, ScopeType.GLOBAL));
    }
    const [role] = await this.db
      .select()
      .from(roles)
      .where(and(...conditions))
      .limit(1);
    return role;
  }

  async create(data: {
    name: string;
    scope: ScopeType;
    tenantId?: string;
    description?: string;
    isDefault?: boolean;
  }) {
    const [role] = await this.db.insert(roles).values(data).returning();
    return role;
  }

  async update(
    id: string,
    data: Partial<{
      name: string;
      description: string;
      isActive: boolean;
      isDefault: boolean;
    }>,
  ) {
    const [role] = await this.db.update(roles).set(data).where(eq(roles.id, id)).returning();
    return role;
  }

  async delete(id: string) {
    await this.db.delete(roles).where(eq(roles.id, id));
  }

  // ============ PERMISSIONS ============

  async getPermissions(roleId: string) {
    const [role, permissions] = await Promise.all([
      this.findById(roleId),
      this.db.select().from(rolePermissions).where(eq(rolePermissions.roleId, roleId)),
    ]);
    return { permissions, roleScope: role?.scope ?? null };
  }

  async setPermissions(roleId: string, permissions: { resource: string; action: string }[]) {
    await this.db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId));

    const newPermissions: {
      roleId: string;
      resourceId: string;
      resource: string;
      action: string;
    }[] = [];

    for (const p of permissions) {
      const resourceRecord = await this.findResourceByName(p.resource);
      if (!resourceRecord) {
        throw new Error(`Resource '${p.resource}' not found`);
      }
      newPermissions.push({
        roleId,
        resourceId: resourceRecord.id,
        resource: p.resource,
        action: p.action,
      });
    }

    if (newPermissions.length > 0) {
      await this.db.insert(rolePermissions).values(newPermissions);
    }

    const result = await this.getPermissions(roleId);
    return result.permissions;
  }

  async addPermission(roleId: string, resource: string, action: string) {
    const resourceRecord = await this.findResourceByName(resource);
    if (!resourceRecord) {
      throw new Error(`Resource '${resource}' not found`);
    }

    const [permission] = await this.db
      .insert(rolePermissions)
      .values({ roleId, resourceId: resourceRecord.id, resource, action })
      .onConflictDoNothing()
      .returning();
    return permission;
  }

  async removePermission(roleId: string, resource: string, action: string) {
    await this.db
      .delete(rolePermissions)
      .where(
        and(
          eq(rolePermissions.roleId, roleId),
          eq(rolePermissions.resource, resource),
          eq(rolePermissions.action, action),
        ),
      );
  }

  // ============ RESOURCES ============

  async findAllResources() {
    const resource = await this.db.select().from(resources);
    return resource;
  }

  async findResourceById(id: string) {
    const [resource] = await this.db.select().from(resources).where(eq(resources.id, id)).limit(1);
    return resource;
  }

  async findResourceByName(name: string) {
    const [resource] = await this.db
      .select()
      .from(resources)
      .where(eq(resources.name, name))
      .limit(1);
    return resource;
  }

  async createResource(data: { name: string; description?: string }) {
    const [resource] = await this.db.insert(resources).values(data).returning();
    return resource;
  }

  async updateResource(
    id: string,
    data: Partial<{ name: string; description: string; isActive: boolean }>,
  ) {
    const [resource] = await this.db
      .update(resources)
      .set(data)
      .where(eq(resources.id, id))
      .returning();
    return resource;
  }

  async deleteResource(id: string) {
    await this.db.delete(resources).where(eq(resources.id, id));
  }
}
