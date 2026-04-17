import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { tenants } from '@/db/schema';
import { user as userSchema } from '@/db/schema';
import { categories } from '@/db/schema/category-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { paymentMethods } from '@/db/schema/payment-method-schema';
import { products } from '@/db/schema/product-schema';
import { rolePermissions } from '@/db/schema/role-permission-schema';
import { roles } from '@/db/schema/role-schema';
import { subscriptionHistories } from '@/db/schema/subscription-history-schema';
import { subscriptionPlans } from '@/db/schema/subscription-plan-schema';
import { subscriptions } from '@/db/schema/subscription-schema';
import type { DrizzleDB } from '@/db/type';
import { auth } from '@/lib/auth';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ScopeType } from '@/rbac/types/rbac.types';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SQL, and, asc, count, eq, ilike, inArray, like, or, sql } from 'drizzle-orm';
import { BillingCycle, CreateTenantDto, TenantQueryDto, UpdateTenantDto } from './dto';

const TEMPLATE_OWNER_ROLE_ID = '00000000-0000-0000-0000-000000000010';
const TEMPLATE_CASHIER_ROLE_ID = '00000000-0000-0000-0000-000000000011';

const BILLING_CYCLE_DAYS: Record<BillingCycle, number> = {
  monthly: 30,
  quarterly: 90,
  semi_annual: 180,
  yearly: 365,
};

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
          user: {
            columns: {
              id: true,
              name: true,
              email: true,
              image: true,
              createdAt: true,
            },
          },
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
      user: tenant.user,
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
    const slugUpper = data.slug.toUpperCase();

    const slugExists = await this.db.query.tenants.findFirst({
      where: eq(tenants.slug, slugUpper),
    });

    if (slugExists) {
      throw new ConflictException(`Nama tenant sudah digunakan`);
    }

    let userId: string;

    if (data.ownerEmail && data.ownerPassword && data.ownerName) {
      const result = await auth.api.signUpEmail({
        body: {
          email: data.ownerEmail,
          password: data.ownerPassword,
          name: data.ownerName,
          roleId: TEMPLATE_OWNER_ROLE_ID,
        },
      });

      if (!result.user) {
        throw new ConflictException('Failed to create owner user');
      }

      userId = result.user.id;
    } else {
      userId = user.id;
    }

    const settings = {
      taxRate: data.taxRate !== undefined ? Number(data.taxRate) : (data.settings?.taxRate ?? 0),
      receiptFooter:
        data.receiptFooter ?? data.settings?.receiptFooter ?? 'Terima kasih telah berbelanja',
      enableOrderTipe: data.settings?.enableOrderTipe ?? false,
    };

    return await this.db.transaction(async (tx) => {
      const [tenant] = await tx
        .insert(tenants)
        .values({
          nama: data.nama,
          slug: slugUpper,
          userId: userId,
          settings,
          image: file?.path || data.image,
          alamat: data.alamat || null,
          noHp: data.noHp || null,
          isActive: data.isActive ?? true,
        })
        .returning();

      await tx.insert(paymentMethods).values([
        { tenantId: tenant.id, nama: 'Tunai' },
        { tenantId: tenant.id, nama: 'QRIS' },
      ]);

      await tx.insert(outlets).values({
        tenantId: tenant.id,
        nama: 'Toko Utama',
        kode: 'OUT1',
        isActive: true,
      });

      await tx.update(userSchema).set({ tenantId: tenant.id }).where(eq(userSchema.id, userId));

      await this.cloneTemplateRoles(tx, tenant.id, userId);

      if (data.planId && data.billingCycle) {
        const plan = await tx.query.subscriptionPlans.findFirst({
          where: eq(subscriptionPlans.id, data.planId),
        });

        if (!plan || !plan.isActive) {
          throw new BadRequestException('Invalid or inactive subscription plan');
        }

        const cycleData = plan.billingCycles.find((bc) => bc.cycle === data.billingCycle);
        if (!cycleData) {
          throw new BadRequestException(
            `Billing cycle '${data.billingCycle}' not found for this plan`,
          );
        }

        const startedAt = new Date();
        const expiresAt = new Date(
          startedAt.getTime() + BILLING_CYCLE_DAYS[data.billingCycle] * 24 * 60 * 60 * 1000,
        );

        const [subscription] = await tx
          .insert(subscriptions)
          .values({
            tenantId: tenant.id,
            planId: data.planId,
            billingCycle: data.billingCycle,
            status: 'active',
            startedAt,
            expiresAt,
          })
          .returning();

        await tx.insert(subscriptionHistories).values({
          tenantId: tenant.id,
          subscriptionId: subscription.id,
          planId: data.planId,
          action: 'subscribed',
          amountPaid: cycleData.price,
          periodStart: startedAt,
          periodEnd: expiresAt,
          performedBy: user.id,
        });
      }

      return tenant;
    });
  }

  private async cloneTemplateRoles(tx: DrizzleDB, tenantId: string, userId: string): Promise<void> {
    const [templateOwnerRole, templateCashierRole] = await Promise.all([
      tx.query.roles.findFirst({
        where: eq(roles.id, TEMPLATE_OWNER_ROLE_ID),
      }),
      tx.query.roles.findFirst({
        where: eq(roles.id, TEMPLATE_CASHIER_ROLE_ID),
      }),
    ]);

    const [templateOwnerPermissions, templateCashierPermissions] = await Promise.all([
      tx.query.rolePermissions.findMany({
        where: eq(rolePermissions.roleId, TEMPLATE_OWNER_ROLE_ID),
      }),
      tx.query.rolePermissions.findMany({
        where: eq(rolePermissions.roleId, TEMPLATE_CASHIER_ROLE_ID),
      }),
    ]);

    if (templateOwnerRole) {
      const [newOwnerRole] = await tx
        .insert(roles)
        .values({
          name: templateOwnerRole.name,
          scope: ScopeType.TENANT,
          tenantId: tenantId,
          description: templateOwnerRole.description,
          isActive: true,
          isDefault: true,
        })
        .returning();

      if (newOwnerRole && templateOwnerPermissions.length > 0) {
        await tx.insert(rolePermissions).values(
          templateOwnerPermissions.map((perm) => ({
            roleId: newOwnerRole.id,
            resource: perm.resource,
            action: perm.action,
          })),
        );
      }

      await tx
        .update(userSchema)
        .set({
          roleId: newOwnerRole.id,
        })
        .where(eq(userSchema.id, userId));
    }

    if (templateCashierRole) {
      const [newCashierRole] = await tx
        .insert(roles)
        .values({
          name: templateCashierRole.name,
          scope: ScopeType.TENANT,
          tenantId: tenantId,
          description: templateCashierRole.description,
          isActive: true,
          isDefault: false,
        })
        .returning();

      if (newCashierRole && templateCashierPermissions.length > 0) {
        await tx.insert(rolePermissions).values(
          templateCashierPermissions.map((perm) => ({
            roleId: newCashierRole.id,
            resource: perm.resource,
            action: perm.action,
          })),
        );
      }
    }
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

    const existingSettings = existingTenant.settings || {
      taxRate: 0,
      receiptFooter: '',
      enableOrderTipe: false,
    };
    const settings = {
      taxRate:
        data.settings?.taxRate !== undefined
          ? data.settings.taxRate
          : data.taxRate !== undefined
            ? Number(data.taxRate)
            : existingSettings.taxRate,
      receiptFooter:
        data.settings?.receiptFooter ?? data.receiptFooter ?? existingSettings.receiptFooter,
      enableOrderTipe: data.settings?.enableOrderTipe ?? existingSettings.enableOrderTipe,
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

  async findOutletsById(id: string, user: CurrentUserWithRole) {
    const tenant = await this.findById(id, user);

    return { data: tenant.outlets };
  }
}
