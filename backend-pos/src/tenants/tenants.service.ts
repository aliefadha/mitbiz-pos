import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { tenants } from '@/db/schema';
import { user as userSchema } from '@/db/schema';
import { categories } from '@/db/schema/category-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { products } from '@/db/schema/product-schema';
import type { DrizzleDB } from '@/db/type';
import { OutletsService } from '@/outlets/outlets.service';
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
    private readonly outletsService: OutletsService,
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
        columns: {
          id: true,
          nama: true,
          slug: true,
          alamat: true,
          noHp: true,
          isActive: true,
          createdAt: true,
        },
      }),
      this.db.select({ count: sql<number>`count(*)` }).from(tenants).where(whereClause),
    ]);

    if (data.length === 0) {
      return {
        data: [],
        meta: {
          page,
          limit,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const tenantIds = data.map((t) => t.id);

    const [usersCount, outletsCount] = await Promise.all([
      this.db
        .select({
          tenantId: userSchema.tenantId,
          count: sql<number>`count(*)`,
        })
        .from(userSchema)
        .where(inArray(userSchema.tenantId, tenantIds))
        .groupBy(userSchema.tenantId),
      this.db
        .select({
          tenantId: outlets.tenantId,
          count: sql<number>`count(*)`,
        })
        .from(outlets)
        .where(inArray(outlets.tenantId, tenantIds))
        .groupBy(outlets.tenantId),
    ]);

    const usersCountMap = new Map(usersCount.map((u) => [u.tenantId, Number(u.count)]));
    const outletsCountMap = new Map(outletsCount.map((o) => [o.tenantId, Number(o.count)]));

    const result = data.map((tenant) => ({
      id: tenant.id,
      nama: tenant.nama,
      slug: tenant.slug,
      alamat: tenant.alamat,
      noHp: tenant.noHp,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      usersCount: usersCountMap.get(tenant.id) || 0,
      outletsCount: outletsCountMap.get(tenant.id) || 0,
    }));

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: result,
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
        user: {
          columns: {
            id: true,
            name: true,
            image: true,
            email: true,
            outletId: true,
            createdAt: true,
          },
          with: {
            role: {
              columns: {
                name: true,
                scope: true,
              },
            },
          },
        },
        outlets: {
          with: {
            cashiers: {
              columns: {
                id: true,
                name: true,
                image: true,
                email: true,
                outletId: true,
                createdAt: true,
              },
              with: {
                role: {
                  columns: {
                    name: true,
                    scope: true,
                  },
                },
              },
            },
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
        user: {
          columns: {
            id: true,
            name: true,
            image: true,
            email: true,
            outletId: true,
            createdAt: true,
          },
          with: {
            role: {
              columns: {
                name: true,
                scope: true,
              },
            },
          },
        },
        outlets: {
          with: {
            cashiers: {
              columns: {
                id: true,
                name: true,
                image: true,
                email: true,
                outletId: true,
                createdAt: true,
              },
              with: {
                role: {
                  columns: {
                    name: true,
                    scope: true,
                  },
                },
              },
            },
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

  async create(data: CreateTenantDto, user: CurrentUserWithRole, file?: Express.Multer.File) {
    if (data.userId) {
      const userExists = await this.db.query.user.findFirst({
        where: eq(userSchema.id, data.userId),
      });

      if (!userExists) {
        throw new NotFoundException(`User tidak ditemukan`);
      }
    }

    data.slug = data.slug.toUpperCase();

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

    const settings = {
      taxRate: data.taxRate !== undefined ? Number(data.taxRate) : (data.settings?.taxRate ?? 0),
      receiptFooter:
        data.receiptFooter ?? data.settings?.receiptFooter ?? 'Terima kasih telah berbelanja',
    };

    const [tenant] = await this.db
      .insert(tenants)
      .values({
        ...data,
        userId: finalUserId,
        settings,
        image: file?.path || data.image,
      })
      .returning();

    // Create default outlet "Outlet Utama"
    await this.outletsService.create(
      {
        tenantId: tenant.id,
        nama: 'Outlet Utama',
        kode: `OUT-001`,
        isActive: true,
      },
      user,
    );

    //TODO: manually add payment method to tenant

    // Link user to the new tenant
    if (finalUserId) {
      await this.db
        .update(userSchema)
        .set({ tenantId: tenant.id })
        .where(eq(userSchema.id, finalUserId));
    }

    //TODO: Create tenant owner and cashier role by copying template from role template and links it with tenantId
    //TODO: Change registered user role into new tenant owner role

    return tenant;
  }

  async update(
    id: string,
    data: UpdateTenantDto,
    user: CurrentUserWithRole,
    file?: Express.Multer.File,
  ) {
    const existingTenant = await this.findById(id, user);

    if (data.slug) {
      data.slug = data.slug.toUpperCase();
    }

    if (data.slug && data.slug !== existingTenant.slug) {
      const slugExists = await this.db.query.tenants.findFirst({
        where: eq(tenants.slug, data.slug.toUpperCase()),
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

    const existingSettings = existingTenant.settings || { taxRate: 0, receiptFooter: '' };
    const settings = {
      taxRate: data.taxRate !== undefined ? Number(data.taxRate) : existingSettings.taxRate,
      receiptFooter: data.receiptFooter ?? existingSettings.receiptFooter,
    };

    const shouldDeleteImage = data.deleteImage === 'true';

    const [tenant] = await this.db
      .update(tenants)
      .set({
        ...data,
        updatedAt: new Date(),
        settings,
        ...(file && { image: file.path }),
        ...(shouldDeleteImage && { image: null }),
      })
      .where(eq(tenants.id, id))
      .returning();

    return tenant;
  }

  async deleteImage(id: string, user: CurrentUserWithRole) {
    const existingTenant = await this.findById(id, user);

    if (!existingTenant.image) {
      throw new NotFoundException('Tenant does not have an image');
    }

    const [tenant] = await this.db
      .update(tenants)
      .set({
        image: null,
        updatedAt: new Date(),
      })
      .where(eq(tenants.id, id))
      .returning();

    return tenant;
  }

  async remove(slug: string, user: CurrentUserWithRole) {
    const existingTenant = await this.findBySlug(slug, user);

    const [tenant] = await this.db
      .update(tenants)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(tenants.slug, slug))
      .returning();

    return { ...tenant, ...existingTenant };
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
