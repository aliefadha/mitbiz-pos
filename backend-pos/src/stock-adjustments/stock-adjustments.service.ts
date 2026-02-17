import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
} from '@nestjs/common';
import { eq, and, desc, sql, SQL } from 'drizzle-orm';
import { stockAdjustments } from '../db/schema/stock-adjustment-schema';
import { products } from '../db/schema/product-schema';
import { outlets } from '../db/schema/outlet-schema';
import { productStocks } from '../db/schema/stock-schema';
import { tenants } from '../db/schema/tenant-schema';
import { CreateStockAdjustmentDto, StockAdjustmentQueryDto } from './dto';
import { DB_CONNECTION } from '../db/db.module';
import type { DrizzleDB } from '../db/type';
import type { CurrentUserType } from '../common/decorators/current-user.decorator';

@Injectable()
export class StockAdjustmentsService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

  async findAll(query: StockAdjustmentQueryDto, user: CurrentUserType) {
    const { page = 1, limit = 10, productId, outletId, adjustedBy } = query;
    const offset = (page - 1) * limit;

    // Get user's tenant ID if owner or cashier
    let effectiveTenantId: number | undefined;
    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant) {
        effectiveTenantId = userTenant.id;
      }
    }

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

    // If owner/cashier, filter by tenant via outlet
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
      this.db
        .select()
        .from(stockAdjustments)
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(stockAdjustments.createdAt)),
      this.db
        .select({ count: sql<number>`count(*)` })
        .from(stockAdjustments)
        .where(whereClause),
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

  async findById(id: number, user: CurrentUserType) {
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

    // Check ownership for owner/cashier via outlet's tenant
    if (user.role === 'owner' || user.role === 'cashier') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && adjustment.outlet.tenantId !== userTenant.id) {
        throw new ForbiddenException(
          'You do not have access to this stock adjustment',
        );
      }
    }

    return adjustment;
  }

  async create(data: CreateStockAdjustmentDto, user: CurrentUserType) {
    // Verify product exists and user has access
    const product = await this.db.query.products.findFirst({
      where: eq(products.id, data.productId),
    });

    if (!product) {
      throw new NotFoundException(
        `Product with ID ${data.productId} not found`,
      );
    }

    // Verify outlet exists
    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, data.outletId),
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${data.outletId} not found`);
    }

    // Check ownership for owner
    if (user.role === 'owner') {
      const userTenant = await this.db.query.tenants.findFirst({
        where: eq(tenants.userId, user.id),
      });
      if (userTenant && outlet.tenantId !== userTenant.id) {
        throw new ForbiddenException(
          'You do not have permission to create stock adjustments in this tenant',
        );
      }
    }

    // Verify outlet and product belong to same tenant
    if (outlet.tenantId !== product.tenantId) {
      throw new ForbiddenException(
        'Product and outlet do not belong to the same tenant',
      );
    }

    const adjustmentData = {
      ...data,
      adjustedBy: user.id,
    };

    const [adjustment] = await this.db
      .insert(stockAdjustments)
      .values(adjustmentData)
      .returning();

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
