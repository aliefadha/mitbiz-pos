import { Injectable, Inject } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { tenants } from '../db/schema/tenant-schema';
import { user } from '../db/schema/auth-schema';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';

@Injectable()
export class UserService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) { }

  async getUserTenantsAndOutlets(userId: string) {
    const [userWithOutlet, ownedTenants] = await Promise.all([
      this.db.query.user.findFirst({
        where: eq(user.id, userId),
        with: {
          outlet: {
            with: {
              tenant: true,
            },
          },
        },
      }),
      this.db.query.tenants.findMany({
        where: eq(tenants.userId, userId),
        with: {
          outlets: true,
        },
      }),
    ]);

    const results = ownedTenants.map((tenant) => ({
      id: tenant.id,
      nama: tenant.nama,
      slug: tenant.slug,
      userId: tenant.userId,
      outlets: tenant.outlets.map((outlet) => ({
        id: outlet.id,
        tenantId: outlet.tenantId,
        nama: outlet.nama,
        kode: outlet.kode,
        alamat: outlet.alamat,
        noHp: outlet.noHp,
        isActive: outlet.isActive,
        createdAt: outlet.createdAt,
      })),
    }));

    if (userWithOutlet?.outlet?.tenant) {
      const tenant = userWithOutlet.outlet.tenant;
      results.push({
        id: tenant.id,
        nama: tenant.nama,
        slug: tenant.slug,
        userId: tenant.userId,
        outlets: [
          {
            id: userWithOutlet.outlet.id,
            tenantId: userWithOutlet.outlet.tenantId,
            nama: userWithOutlet.outlet.nama,
            kode: userWithOutlet.outlet.kode,
            alamat: userWithOutlet.outlet.alamat,
            noHp: userWithOutlet.outlet.noHp,
            isActive: userWithOutlet.outlet.isActive,
            createdAt: userWithOutlet.outlet.createdAt,
          },
        ],
      });
    }

    return results;
  }

  async getUsersByOwner(userId: string, tenantId?: string) {
    let userTenants = await this.db.query.tenants.findMany({
      where: eq(tenants.userId, userId),
      with: {
        outlets: true,
      },
    });

    if (tenantId) {
      userTenants = userTenants.filter((t) => t.id === tenantId);
    }

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
