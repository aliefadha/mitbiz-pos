import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { categories } from '@/db/schema/category-schema';
import { orderItems } from '@/db/schema/order-item-schema';
import { orders } from '@/db/schema/order-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { products } from '@/db/schema/product-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, inArray, lte, sql } from 'drizzle-orm';
import { SalesQueryDto } from './dto';

@Injectable()
export class SalesService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  private buildDateConditions(startDate?: string, endDate?: string) {
    const conditions: any[] = [];
    if (startDate) {
      conditions.push(gte(orders.completedAt, new Date(startDate)));
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.completedAt, end));
    }
    return conditions.length > 0 ? and(...conditions) : undefined;
  }

  private async getTenantCondition(user: CurrentUserWithRole, tenantId?: string) {
    // Validate that query tenantId matches user's allowed tenant
    if (tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, tenantId);
      return eq(orders.tenantId, tenantId);
    }

    // Get effective tenant ID for the user
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    if (effectiveTenantId) {
      return eq(orders.tenantId, effectiveTenantId);
    }

    return undefined;
  }

  async getTopProducts(query: SalesQueryDto, user: CurrentUserWithRole, limit = 10) {
    const dateConditions = this.buildDateConditions(query.startDate, query.endDate);
    const tenantCondition = await this.getTenantCondition(user, query.tenantId);
    const outletCondition = query.outletId ? eq(orders.outletId, query.outletId) : undefined;

    const whereCondition = and(dateConditions, tenantCondition, outletCondition);

    const result = await this.db
      .select({
        productId: orderItems.productId,
        productName: products.nama,
        productSku: products.sku,
        categoryId: products.categoryId,
        categoryName: categories.nama,
        totalQuantity: sql`SUM(${orderItems.quantity})`,
        totalRevenue: sql`COALESCE(SUM(${orderItems.total}::numeric), 0)`,
        totalOrders: sql`COUNT(DISTINCT ${orderItems.orderId})`,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(whereCondition, eq(orders.status, 'complete')))
      .groupBy(
        orderItems.productId,
        products.nama,
        products.sku,
        products.categoryId,
        categories.nama,
      )
      .orderBy(desc(sql`SUM(${orderItems.quantity})`))
      .limit(limit);

    return result.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      productSku: row.productSku,
      categoryId: row.categoryId,
      categoryName: row.categoryName,
      totalQuantity: Number(row.totalQuantity),
      totalRevenue: Number(row.totalRevenue),
      totalOrders: Number(row.totalOrders),
    }));
  }

  async getSalesByCategory(query: SalesQueryDto, user: CurrentUserWithRole) {
    const dateConditions = this.buildDateConditions(query.startDate, query.endDate);
    const tenantCondition = await this.getTenantCondition(user, query.tenantId);
    const outletCondition = query.outletId ? eq(orders.outletId, query.outletId) : undefined;

    const whereCondition = and(dateConditions, tenantCondition, outletCondition);

    const result = await this.db
      .select({
        categoryId: products.categoryId,
        categoryName: categories.nama,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`COALESCE(SUM(${orderItems.total}::numeric), 0)`,
        totalOrders: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(whereCondition, eq(orders.status, 'complete')))
      .groupBy(products.categoryId, categories.nama)
      .orderBy(desc(sql`COALESCE(SUM(${orderItems.total}::numeric), 0)`));

    return result.map((row) => ({
      categoryId: row.categoryId,
      categoryName: row.categoryName || 'Uncategorized',
      totalQuantity: Number(row.totalQuantity),
      totalRevenue: Number(row.totalRevenue),
      totalOrders: Number(row.totalOrders),
    }));
  }

  async getSalesByProduct(query: SalesQueryDto, user: CurrentUserWithRole) {
    const dateConditions = this.buildDateConditions(query.startDate, query.endDate);
    const tenantCondition = await this.getTenantCondition(user, query.tenantId);
    const outletCondition = query.outletId ? eq(orders.outletId, query.outletId) : undefined;

    const whereCondition = and(dateConditions, tenantCondition, outletCondition);

    const result = await this.db
      .select({
        productId: orderItems.productId,
        productName: products.nama,
        productSku: products.sku,
        totalQuantity: sql<number>`SUM(${orderItems.quantity})`,
        totalRevenue: sql<number>`COALESCE(SUM(${orderItems.total}::numeric), 0)`,
        totalOrders: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
        averagePrice: sql<number>`COALESCE(AVG(${orderItems.hargaSatuan}::numeric), 0)`,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(whereCondition, eq(orders.status, 'complete')))
      .groupBy(orderItems.productId, products.nama, products.sku)
      .orderBy(desc(sql`COALESCE(SUM(${orderItems.total}::numeric), 0)`));

    return result.map((row) => ({
      productId: row.productId,
      productName: row.productName,
      productSku: row.productSku,
      totalQuantity: Number(row.totalQuantity),
      totalRevenue: Number(row.totalRevenue),
      totalOrders: Number(row.totalOrders),
      averagePrice: Number(row.averagePrice),
    }));
  }
}
