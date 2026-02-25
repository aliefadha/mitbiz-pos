import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, like, desc, sql, SQL } from 'drizzle-orm';
import { paymentMethods } from '../db/schema/payment-method-schema';
import { tenants } from '../db/schema/tenant-schema';
import {
  CreatePaymentMethodDto,
  UpdatePaymentMethodDto,
  PaymentMethodQueryDto,
} from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';

@Injectable()
export class PaymentMethodsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: PaymentMethodQueryDto) {
    const { page = 1, limit = 10, search, isActive, tenantId } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(paymentMethods.isActive, isActive));
    }

    if (tenantId) {
      conditions.push(eq(paymentMethods.tenantId, tenantId));
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
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(paymentMethods)
        .where(whereClause),
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

  async findById(id: string, user: CurrentUserType) {
    const paymentMethod = await this.db.query.paymentMethods.findFirst({
      where: eq(paymentMethods.id, id),
      with: {
        tenant: true,
      },
    });

    if (!paymentMethod) {
      throw new NotFoundException(`Payment method with ID ${id} not found`);
    }

    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (
        userTenantIds.length > 0 &&
        !userTenantIds.includes(paymentMethod.tenantId)
      ) {
        throw new ForbiddenException(
          'You do not have access to this payment method',
        );
      }
    }

    return paymentMethod;
  }

  async create(data: CreatePaymentMethodDto, user: CurrentUserType) {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, data.tenantId),
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${data.tenantId} not found`);
    }

    if (user.role === 'owner' && tenant.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to create payment methods in this tenant',
      );
    }

    const [paymentMethod] = await this.db
      .insert(paymentMethods)
      .values(data)
      .returning();

    return paymentMethod;
  }

  async update(
    id: string,
    data: UpdatePaymentMethodDto,
    user: CurrentUserType,
  ) {
    const existingPaymentMethod = await this.findById(id, user);

    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (
        userTenantIds.length > 0 &&
        !userTenantIds.includes(existingPaymentMethod.tenantId)
      ) {
        throw new ForbiddenException(
          'You do not have permission to update this payment method',
        );
      }
    }

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

  async remove(id: string, user: CurrentUserType) {
    const paymentMethod = await this.findById(id, user);

    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (
        userTenantIds.length > 0 &&
        !userTenantIds.includes(paymentMethod.tenantId)
      ) {
        throw new ForbiddenException(
          'You do not have permission to delete this payment method',
        );
      }
    }

    const [deletedPaymentMethod] = await this.db
      .delete(paymentMethods)
      .where(eq(paymentMethods.id, id))
      .returning();

    return deletedPaymentMethod;
  }
}
