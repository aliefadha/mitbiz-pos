import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, like, desc, sql, SQL, or } from 'drizzle-orm';
import { discounts } from '../db/schema/discount-schema';
import { tenants } from '../db/schema/tenant-schema';
import { CreateDiscountDto, UpdateDiscountDto, DiscountQueryDto } from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';

@Injectable()
export class DiscountsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: DiscountQueryDto) {
    const { page = 1, limit = 10, search, isActive, tenantId } = query;
    const offset = (page - 1) * limit;

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(discounts.isActive, isActive));
    }

    if (tenantId) {
      conditions.push(eq(discounts.tenantId, tenantId));
    }

    if (search) {
      conditions.push(like(discounts.nama, `%${search}%`));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(discounts)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(discounts.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(discounts)
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

  async findActiveForOutlet(tenantId: string, outletId: string) {
    const data = await this.db
      .select()
      .from(discounts)
      .where(
        and(
          eq(discounts.tenantId, tenantId),
          eq(discounts.isActive, true),
          eq(discounts.scope, 'transaction'),
          or(eq(discounts.isGlobal, true), eq(discounts.outletId, outletId)),
        ),
      );

    return {
      data,
      meta: { total: data.length },
    };
  }

  async findById(id: string, user: CurrentUserType) {
    const discount = await this.db.query.discounts.findFirst({
      where: eq(discounts.id, id),
      with: {
        tenant: true,
      },
    });

    if (!discount) {
      throw new NotFoundException(`Discount with ID ${id} not found`);
    }

    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (userTenantIds.length > 0 && !userTenantIds.includes(discount.tenantId)) {
        throw new ForbiddenException('You do not have access to this discount');
      }
    }

    return discount;
  }

  async create(data: CreateDiscountDto, user: CurrentUserType) {
    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, data.tenantId),
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${data.tenantId} not found`);
    }

    if (user.role === 'owner' && tenant.userId !== user.id) {
      throw new ForbiddenException(
        'You do not have permission to create discounts in this tenant',
      );
    }

    const [discount] = await this.db
      .insert(discounts)
      .values(data)
      .returning();

    return discount;
  }

  async update(id: string, data: UpdateDiscountDto, user: CurrentUserType) {
    const existingDiscount = await this.findById(id, user);

    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (userTenantIds.length > 0 && !userTenantIds.includes(existingDiscount.tenantId)) {
        throw new ForbiddenException(
          'You do not have permission to update this discount',
        );
      }
    }

    const [discount] = await this.db
      .update(discounts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(discounts.id, id))
      .returning();

    return discount;
  }

  async remove(id: string, user: CurrentUserType) {
    const discount = await this.findById(id, user);

    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (userTenantIds.length > 0 && !userTenantIds.includes(discount.tenantId)) {
        throw new ForbiddenException(
          'You do not have permission to delete this discount',
        );
      }
    }

    const [deletedDiscount] = await this.db
      .delete(discounts)
      .where(eq(discounts.id, id))
      .returning();

    return deletedDiscount;
  }
}
