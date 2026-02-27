import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, like, asc, desc, sql, or, ilike, count, SQL, inArray } from 'drizzle-orm';
import { tenants } from '@/db/schema';
import { user as userSchema } from '@/db/schema';
import { outlets } from '@/db/schema/outlet-schema';
import { categories } from '@/db/schema/category-schema';
import { products } from '@/db/schema/product-schema';
import { CreateTenantDto, UpdateTenantDto, TenantQueryDto } from './dto';
import { DB_CONNECTION } from '@/db/db.module';
import type { DrizzleDB } from '@/db/type';
import type { CurrentUserType } from '@/common/decorators/current-user.decorator';

@Injectable()
export class TenantsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: TenantQueryDto, user: CurrentUserType) {
    const { page = 1, limit = 10, search, isActive } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(tenants.isActive, isActive));
    }

    if (search) {
      conditions.push(like(tenants.nama, `%${search}%`));
    }

    // Role-based filtering
    if (user.role === 'owner') {
      conditions.push(eq(tenants.userId, user.id));
    } else if (user.role === 'cashier' && user.outletId) {
      const userOutlets = await this.db.query.outlets.findMany({
        where: eq(outlets.id, user.outletId),
      });
      const tenantIds = [...new Set(userOutlets.map((o) => o.tenantId))];
      if (tenantIds.length > 0) {
        conditions.push(inArray(tenants.id, tenantIds));
      }
    }
    // Admin: no filter, sees all tenants

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db.query.tenants.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [asc(tenants.createdAt)],
        with: {
          outlets: true,
        },
      }),
      this.db.select({ count: sql<number>`count(*)` }).from(tenants).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string, user: CurrentUserType) {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
      with: {
        user: true,
        outlets: {
          with: {
            cashiers: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant tidak ditemukan`);
    }

    // Check ownership for owner role
    if (user.role === 'owner' && tenant.userId !== user.id) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    return tenant;
  }

  async create(data: CreateTenantDto, user: CurrentUserType) {
    if (data.userId) {
      const userExists = await this.db.query.user.findFirst({
        where: eq(userSchema.id, data.userId),
      });

      if (!userExists) {
        throw new NotFoundException(`User tidak ditemukan`);
      }
    }

    const slugExists = await this.db.query.tenants.findFirst({
      where: eq(tenants.slug, data.slug),
    });

    if (slugExists) {
      throw new ConflictException(`Nama tenant sudah digunakan`);
    }

    const nameExists = await this.db.query.tenants.findFirst({
      where: or(ilike(tenants.nama, data.nama), eq(tenants.nama, data.nama)),
    });

    if (nameExists) {
      throw new ConflictException(`Nama tenant sudah digunakan`);
    }

    // If owner, force userId to be their own id
    let finalUserId = data.userId;
    if (user.role === 'owner') {
      finalUserId = user.id;
    }

    const [tenant] = await this.db
      .insert(tenants)
      .values({
        ...data,
        userId: finalUserId,
        settings: data.settings || {
          currency: 'IDR',
          timezone: 'Asia/Jakarta',
          taxRate: 0,
        },
      })
      .returning();

    return tenant;
  }

  async update(slug: string, data: UpdateTenantDto, user: CurrentUserType) {
    const existingTenant = await this.findBySlug(slug, user);

    // Verify ownership again
    if (user.role === 'owner' && existingTenant.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to update this tenant');
    }

    if (data.slug && data.slug !== slug) {
      const slugExists = await this.db.query.tenants.findFirst({
        where: eq(tenants.slug, data.slug),
      });

      if (slugExists) {
        throw new ConflictException(`Nama tenant sudah digunakan`);
      }
    }

    if (data.nama && data.nama !== existingTenant.nama) {
      const nameExists = await this.db.query.tenants.findFirst({
        where: or(ilike(tenants.nama, data.nama), eq(tenants.nama, data.nama)),
      });

      if (nameExists) {
        throw new ConflictException(`Nama tenant sudah digunakan`);
      }
    }

    const [tenant] = await this.db
      .update(tenants)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(tenants.slug, slug))
      .returning();

    return tenant;
  }

  async remove(slug: string, user: CurrentUserType) {
    const tenant = await this.findBySlug(slug, user);

    // Verify ownership
    if (user.role === 'owner' && tenant.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to delete this tenant');
    }

    const [deletedTenant] = await this.db.delete(tenants).where(eq(tenants.slug, slug)).returning();

    return deletedTenant;
  }

  async getSummary(slug: string, user: CurrentUserType) {
    const tenant = await this.findBySlug(slug, user);

    const [outletsResult, categoriesResult, productsResult] = await Promise.all([
      this.db.select({ count: count() }).from(outlets).where(eq(outlets.tenantId, tenant.id)),
      this.db.select({ count: count() }).from(categories).where(eq(categories.tenantId, tenant.id)),
      this.db.select({ count: count() }).from(products).where(eq(products.tenantId, tenant.id)),
    ]);

    return {
      outletsCount: Number(outletsResult[0]?.count || 0),
      categoriesCount: Number(categoriesResult[0]?.count || 0),
      productsCount: Number(productsResult[0]?.count || 0),
      user: tenant.user,
    };
  }

  // Helper method to get user's tenant ID
  async getUserTenantId(userId: string): Promise<string | null> {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.userId, userId),
    });
    return tenant?.id || null;
  }

  async findUsers(slug: string, user: CurrentUserType) {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
      with: {
        user: true,
        outlets: {
          with: {
            cashiers: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant tidak ditemukan`);
    }

    if (user.role === 'owner' && tenant.userId !== user.id) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    const allUsers: (typeof tenant.user)[] = [];
    if (tenant.user) {
      allUsers.push(tenant.user);
    }
    for (const outlet of tenant.outlets) {
      if (outlet.cashiers) {
        for (const cashier of outlet.cashiers) {
          if (cashier.id && !allUsers.find((u) => u?.id === cashier.id)) {
            allUsers.push(cashier);
          }
        }
      }
    }

    return { data: allUsers };
  }

  async findOutlets(slug: string, user: CurrentUserType) {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.slug, slug),
      with: {
        outlets: {
          with: {
            cashiers: true,
          },
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant tidak ditemukan`);
    }

    if (user.role === 'owner' && tenant.userId !== user.id) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    return { data: tenant.outlets };
  }
}
