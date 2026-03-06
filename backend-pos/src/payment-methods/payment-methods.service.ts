import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { paymentMethods } from '@/db/schema/payment-method-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, desc, eq, like, sql } from 'drizzle-orm';
import { CreatePaymentMethodDto, PaymentMethodQueryDto, UpdatePaymentMethodDto } from './dto';

@Injectable()
export class PaymentMethodsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: PaymentMethodQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, search, isActive, tenantId } = query;
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
      conditions.push(like(paymentMethods.nama, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
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
    const paymentMethod = await this.db.query.paymentMethods.findFirst({
      where: eq(paymentMethods.id, id),
      with: {
        tenant: true,
      },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    // Check tenant access (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, paymentMethod.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this payment method');
    }

    return paymentMethod;
  }

  async create(data: CreatePaymentMethodDto, user: CurrentUserWithRole) {
    // Validate tenant access (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, data.tenantId);

    const [paymentMethod] = await this.db.insert(paymentMethods).values(data).returning();

    return paymentMethod;
  }

  async update(id: string, data: UpdatePaymentMethodDto, user: CurrentUserWithRole) {
    // findById already validates tenant access
    await this.findById(id, user);

    const [paymentMethod] = await this.db
      .update(paymentMethods)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(paymentMethods.id, id))
      .returning();

    return paymentMethod;
  }

  async remove(id: string, user: CurrentUserWithRole) {
    // findById already validates tenant access
    await this.findById(id, user);

    const [deletedPaymentMethod] = await this.db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .returning();

    return deletedPaymentMethod;
  }
}
