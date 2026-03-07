import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { tenants } from '@/db/schema';
import { user as userSchema } from '@/db/schema';
import { categories } from '@/db/schema/category-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { products } from '@/db/schema/product-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SQL, and, asc, count, eq, ilike, inArray, like, or, sql } from 'drizzle-orm';
import { CreateTenantDto, TenantQueryDto, UpdateTenantDto } from './dto';

@Injectable()
export class TenantsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: TenantQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, search, isActive } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(tenants.isActive, isActive));
    }

    if (search) {
      conditions.push(like(tenants.nama, `%${search}%`));
    }

    // Get effective tenant ID for the user
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    // For tenant-scoped roles, filter by their assigned tenant
    if (effectiveTenantId) {
      conditions.push(eq(tenants.id, effectiveTenantId));
    }
    // For global roles (admin), no filter - they see all tenants

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

  async findById(id: string, user: CurrentUserWithRole) {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, id),
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

    // Check tenant access (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    return tenant;
  }

  async findBySlug(slug: string, user: CurrentUserWithRole) {
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

    // Check tenant access (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, tenant.id);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this tenant');
    }

    return tenant;
  }

  async create(data: CreateTenantDto, user: CurrentUserWithRole) {
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

    // If user is creating their own tenant (not admin assigning), force userId to be their own id
    let finalUserId = data.userId;
    if (!user.role || user.role.scope !== 'global') {
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

  async update(slug: string, data: UpdateTenantDto, user: CurrentUserWithRole) {
    const existingTenant = await this.findBySlug(slug, user);

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

  async remove(slug: string, user: CurrentUserWithRole) {
    // findBySlug already validates tenant access
    await this.findBySlug(slug, user);

    const [deletedTenant] = await this.db.delete(tenants).where(eq(tenants.slug, slug)).returning();

    return deletedTenant;
  }

  async getSummary(slug: string, user: CurrentUserWithRole) {
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

  async findUsers(slug: string, user: CurrentUserWithRole) {
    const tenant = await this.findBySlug(slug, user);

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

  async findOutlets(slug: string, user: CurrentUserWithRole) {
    const tenant = await this.findBySlug(slug, user);

    return { data: tenant.outlets };
  }
}
