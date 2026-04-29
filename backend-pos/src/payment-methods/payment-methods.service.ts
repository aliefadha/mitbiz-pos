import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { paymentMethods } from '@/db/schema/payment-method-schema';
import { tenants } from '@/db/schema/tenant-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, desc, eq, ilike, sql } from 'drizzle-orm';
import { CreatePaymentMethodDto, PaymentMethodQueryDto, UpdatePaymentMethodDto } from './dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: PaymentMethodQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, search, isActive = true, tenantId } = query;
    const offset = (page - 1) * limit;

    // Validate that query tenantId matches user's allowed tenant
    if (tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, tenantId);
    }

    // Get effective tenant ID for the user (for filtering if no tenantId provided)
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(paymentMethods.isActive, isActive));
    }

    // Use query tenantId if provided, otherwise use effective tenant (for non-global roles)
    const filterTenantId = tenantId || effectiveTenantId;
    if (filterTenantId) {
      conditions.push(eq(paymentMethods.tenantId, filterTenantId));
    }

    if (search) {
      conditions.push(ilike(paymentMethods.nama, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db
        .select({
          id: paymentMethods.id,
          tenantId: paymentMethods.tenantId,
          nama: paymentMethods.nama,
          isActive: paymentMethods.isActive,
          createdAt: paymentMethods.createdAt,
          updatedAt: paymentMethods.updatedAt,
        })
        .from(paymentMethods)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(paymentMethods.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(paymentMethods).where(whereClause),
    ]);

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string, user: CurrentUserWithRole) {
    // Simple existence check first
    const paymentMethod = await this.db
      .select({ tenantId: paymentMethods.tenantId })
      .from(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .limit(1);

    if (!paymentMethod || paymentMethod.length === 0) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    // Check tenant access (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, paymentMethod[0].tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this payment method');
    }

    // Enriched query with joins
    const result = await this.db
      .select({
        id: paymentMethods.id,
        tenantId: paymentMethods.tenantId,
        nama: paymentMethods.nama,
        isActive: paymentMethods.isActive,
        createdAt: paymentMethods.createdAt,
        updatedAt: paymentMethods.updatedAt,
        tenantIdRef: tenants.id,
        tenantNama: tenants.nama,
        tenantSlug: tenants.slug,
        tenantIsActive: tenants.isActive,
        tenantCreatedAt: tenants.createdAt,
        tenantUpdatedAt: tenants.updatedAt,
      })
      .from(paymentMethods)
      .leftJoin(tenants, eq(paymentMethods.tenantId, tenants.id))
      .where(eq(paymentMethods.id, id))
      .limit(1);

    const row = result[0];

    return {
      id: row.id,
      tenantId: row.tenantId,
      nama: row.nama,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      tenant: row.tenantIdRef
        ? {
            id: row.tenantIdRef,
            nama: row.tenantNama,
            slug: row.tenantSlug,
            isActive: row.tenantIsActive,
            createdAt: row.tenantCreatedAt,
            updatedAt: row.tenantUpdatedAt,
          }
        : null,
    };
  }

  async create(data: CreatePaymentMethodDto, user: CurrentUserWithRole): Promise<void> {
    // Validate tenant access (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, data.tenantId);

    await this.db.insert(paymentMethods).values(data);
  }

  async update(id: string, data: UpdatePaymentMethodDto, user: CurrentUserWithRole): Promise<void> {
    // findById already validates tenant access
    await this.findById(id, user);

    await this.db
      .update(paymentMethods)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(paymentMethods.id, id));
  }

  async remove(id: string, user: CurrentUserWithRole): Promise<void> {
    await this.findById(id, user);

    await this.db
      .update(paymentMethods)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(paymentMethods.id, id));
  }
}
