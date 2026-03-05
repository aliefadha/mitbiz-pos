import type { CurrentUserType } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { discountProducts, discounts } from '@/db/schema/discount-schema';
import { tenants } from '@/db/schema/tenant-schema';
import type { DrizzleDB } from '@/db/type';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, asc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { CreateDiscountDto, DiscountQueryDto, UpdateDiscountDto } from './dto';

@Injectable()
export class DiscountsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) { }

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
        .orderBy(asc(discounts.createdAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(discounts).where(whereClause),
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
    const discount = await this.db.query.discounts.findFirst({
      where: eq(discounts.id, id),
      with: {
        tenant: true,
        products: {
          with: {
            product: true,
          },
        },
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
    const { productIds, ...discountData } = data;

    const tenant = await this.db.query.tenants.findFirst({
      where: eq(tenants.id, data.tenantId),
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${data.tenantId} not found`);
    }

    if (user.role === 'owner' && tenant.userId !== user.id) {
      throw new ForbiddenException('You do not have permission to create discounts in this tenant');
    }

    const [discount] = await this.db.insert(discounts).values(discountData).returning();

    // Insert into join table if productIds provided
    if (productIds && productIds.length > 0) {
      await this.db.insert(discountProducts).values(
        productIds.map(productId => ({
          discountId: discount.id,
          productId,
        }))
      );
    }

    return discount;
  }

  async update(id: string, data: UpdateDiscountDto, user: CurrentUserType) {
    const { productIds, ...discountData } = data;
    const existingDiscount = await this.findById(id, user);

    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      const userTenantIds = userTenants.map((t) => t.id);
      if (userTenantIds.length > 0 && !userTenantIds.includes(existingDiscount.tenantId)) {
        throw new ForbiddenException('You do not have permission to update this discount');
      }
    }

    const [discount] = await this.db
      .update(discounts)
      .set({
        ...discountData,
        updatedAt: new Date(),
      })
      .where(eq(discounts.id, id))
      .returning();

    // Update product associations if productIds provided
    if (productIds !== undefined) {
      // Delete existing associations
      await this.db.delete(discountProducts).where(eq(discountProducts.discountId, id));

      // Insert new associations
      if (productIds.length > 0) {
        await this.db.insert(discountProducts).values(
          productIds.map(productId => ({
            discountId: id,
            productId,
          }))
        );
      }
    }

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
        throw new ForbiddenException('You do not have permission to delete this discount');
      }
    }

    const [deletedDiscount] = await this.db
      .delete(discounts)
      .where(eq(discounts.id, id))
      .returning();

    return deletedDiscount;
  }
}
