import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { discountProducts, discounts } from '@/db/schema/discount-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, asc, eq, inArray, like, or, sql } from 'drizzle-orm';
import { CreateDiscountDto, DiscountQueryDto, UpdateDiscountDto } from './dto';

@Injectable()
export class DiscountsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: DiscountQueryDto, user: CurrentUserWithRole) {
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
      conditions.push(eq(discounts.isActive, isActive));
    }

    // Use query tenantId if provided, otherwise use effective tenant (for non-global roles)
    const filterTenantId = tenantId || effectiveTenantId;
    if (filterTenantId) {
      conditions.push(eq(discounts.tenantId, filterTenantId));
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

  async findById(id: string, user: CurrentUserWithRole) {
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

    // Check tenant access (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, discount.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this discount');
    }

    return discount;
  }

  async create(data: CreateDiscountDto, user: CurrentUserWithRole) {
    const { productIds, ...discountData } = data;

    // Validate tenant access (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, data.tenantId);

    const [discount] = await this.db.insert(discounts).values(discountData).returning();

    // Insert into join table if productIds provided
    if (productIds && productIds.length > 0) {
      await this.db.insert(discountProducts).values(
        productIds.map((productId) => ({
          discountId: discount.id,
          productId,
        })),
      );
    }

    return discount;
  }

  async update(id: string, data: UpdateDiscountDto, user: CurrentUserWithRole) {
    const { productIds, ...discountData } = data;
    // findById already validates tenant access
    const existingDiscount = await this.findById(id, user);

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
          productIds.map((productId) => ({
            discountId: id,
            productId,
          })),
        );
      }
    }

    return discount;
  }

  async remove(id: string, user: CurrentUserWithRole) {
    const existingDiscount = await this.findById(id, user);

    const [discount] = await this.db
      .update(discounts)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(discounts.id, id))
      .returning();

    return { ...discount, ...existingDiscount };
  }
}
