import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { tenants } from '../db/schema/tenant-schema';
import { outlets } from '../db/schema/outlet-schema';
import { user } from '../db/schema/auth-schema';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';

@Injectable()
export class UserService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async getUserTenantsAndOutlets(userId: string) {
    const userTenants = await this.db.query.tenants.findMany({
      where: eq(tenants.userId, userId),
      with: {
        outlets: true,
      },
    });

    return userTenants.map((tenant) => ({
      id: tenant.id,
      nama: tenant.nama,
      slug: tenant.slug,
      userId: tenant.userId,
      outlets: tenant.outlets.map((outlet) => ({
        id: outlet.id,
        tenantId: outlet.tenantId,
        name: outlet.nama,
        kode: outlet.kode,
        alamat: outlet.alamat,
        noHp: outlet.noHp,
        isActive: outlet.isActive,
        createdAt: outlet.createdAt,
      })),
    }));
  }

  async getUsersByOwner(userId: string) {
    const userTenants = await this.db.query.tenants.findMany({
      where: eq(tenants.userId, userId),
      with: {
        outlets: true,
      },
    });

    const tenantIds = userTenants.map((t) => t.id);
    const outletIds = userTenants.flatMap((t) => t.outlets.map((o) => o.id));

    const allUsers = await this.db.query.user.findMany({
      where: eq(user.role, 'cashier'),
    });

    const filteredUsers = allUsers.filter(
      (u) => u.outletId && outletIds.includes(u.outletId),
    );

    return { users: filteredUsers, total: filteredUsers.length };
  }
}
