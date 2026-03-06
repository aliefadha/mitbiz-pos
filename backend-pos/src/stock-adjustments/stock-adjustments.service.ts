import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { outlets } from '@/db/schema/outlet-schema';
import { products } from '@/db/schema/product-schema';
import { stockAdjustments } from '@/db/schema/stock-adjustment-schema';
import { productStocks } from '@/db/schema/stock-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { SQL, and, desc, eq, sql } from 'drizzle-orm';
import { CreateStockAdjustmentDto, StockAdjustmentQueryDto } from './dto';

@Injectable()
export class StockAdjustmentsService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: StockAdjustmentQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, productId, outletId, adjustedBy } = query;
    const offset = (page - 1) * limit;

    // Get effective tenant ID for the user
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    const conditions: SQL<unknown>[] = [];

    if (productId) {
      conditions.push(eq(stockAdjustments.productId, productId));
    }

    if (outletId) {
      conditions.push(eq(stockAdjustments.outletId, outletId));
    }

    if (adjustedBy) {
      conditions.push(eq(stockAdjustments.adjustedBy, adjustedBy));
    }

    // Filter by tenant via outlet for non-global roles
    if (effectiveTenantId) {
      const outletIdsInTenant = await this.db
        .select({ id: outlets.id })
        .from(outlets)
        .where(eq(outlets.tenantId, effectiveTenantId));

      const outletIdList = outletIdsInTenant.map((o) => o.id);

      if (outletIdList.length === 0) {
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

      conditions.push(
        sql`${stockAdjustments.outletId} IN (${sql.join(
          outletIdList.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db.query.stockAdjustments.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: desc(stockAdjustments.createdAt),
        with: {
          product: true,
          outlet: true,
          user: true,
        },
      }),
      this.db.select({ count: sql<number>`count(*)` }).from(stockAdjustments).where(whereClause),
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
    const adjustment = await this.db.query.stockAdjustments.findFirst({
      where: eq(stockAdjustments.id, id),
      with: {
        product: true,
        outlet: true,
        user: true,
      },
    });

    if (!adjustment) {
      throw new NotFoundException(`Stock adjustment with ID ${id} not found`);
    }

    // Check tenant access via outlet's tenant (permission already checked by guard)
    const hasAccess = await this.tenantAuth.canAccessTenant(user, adjustment.outlet.tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this stock adjustment');
    }

    return adjustment;
  }

  async create(data: CreateStockAdjustmentDto, user: CurrentUserWithRole) {
    // Verify product exists
    const product = await this.db.query.products.findFirst({
      where: eq(products.id, data.productId),
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${data.productId} not found`);
    }

    // Verify outlet exists
    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, data.outletId),
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${data.outletId} not found`);
    }

    // Validate tenant access via outlet (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, outlet.tenantId);

    // Verify outlet and product belong to same tenant
    if (outlet.tenantId !== product.tenantId) {
      throw new ForbiddenException('Product and outlet do not belong to the same tenant');
    }

    const adjustmentData = {
      ...data,
      adjustedBy: user.id,
    };

    const [adjustment] = await this.db.insert(stockAdjustments).values(adjustmentData).returning();

    const existingStock = await this.db.query.productStocks.findFirst({
      where: and(
        eq(productStocks.productId, data.productId),
        eq(productStocks.outletId, data.outletId),
      ),
    });

    if (existingStock) {
      await this.db
        .update(productStocks)
        .set({
          quantity: existingStock.quantity + data.quantity,
          updatedAt: new Date(),
        })
        .where(eq(productStocks.id, existingStock.id));
    } else {
      await this.db.insert(productStocks).values({
        productId: data.productId,
        outletId: data.outletId,
        quantity: data.quantity,
      });
    }

    return adjustment;
  }
}
