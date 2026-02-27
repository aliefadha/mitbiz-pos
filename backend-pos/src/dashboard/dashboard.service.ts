import { Injectable, Inject } from '@nestjs/common';
import { eq, and, gte, lte, sql, desc, inArray } from 'drizzle-orm';
import { orders } from '@/db/schema/order-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { paymentMethods } from '@/db/schema/payment-method-schema';
import { user as usersTable } from '@/db/schema/auth-schema';
import { products } from '@/db/schema/product-schema';
import { DashboardQueryDto } from './dto';
import { DB_CONNECTION } from '@/db/db.module';
import type { DrizzleDB } from '@/db/type';
import type { CurrentUserType } from '@/common/decorators/current-user.decorator';
import { tenants } from '@/db/schema/tenant-schema';

@Injectable()
export class DashboardService {
  constructor(@Inject(DB_CONNECTION) private db: DrizzleDB) {}

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

  async getStats(query: DashboardQueryDto, user: CurrentUserType) {
    const dateConditions = this.buildDateConditions(query.startDate, query.endDate);
    const tenantCondition = await this.getTenantCondition(user, query.tenantId);

    const outletCondition = query.outletId ? eq(orders.outletId, query.outletId) : undefined;

    const whereCondition = and(dateConditions, tenantCondition, outletCondition);

    const result = await this.db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
        totalTax: sql<number>`COALESCE(SUM(${orders.jumlahPajak}::numeric), 0)`,
        totalDiscount: sql<number>`COALESCE(SUM(${orders.jumlahDiskon}::numeric), 0)`,
        averageOrder: sql<number>`COALESCE(AVG(${orders.total}::numeric), 0)`,
      })
      .from(orders)
      .where(and(whereCondition, eq(orders.status, 'complete')));

    const tenantIds = await this.getTenantIds(user, query.tenantId);

    let activeOutlets = 0;
    let activeProducts = 0;
    let activeCashiers = 0;
    let totalOutlets = 0;
    let totalProducts = 0;

    if (tenantIds.length > 0) {
      const outletsResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(outlets)
        .where(and(inArray(outlets.tenantId, tenantIds), eq(outlets.isActive, true)));
      activeOutlets = Number(outletsResult[0]?.count || 0);

      const totalOutletsResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(outlets)
        .where(inArray(outlets.tenantId, tenantIds));
      totalOutlets = Number(totalOutletsResult[0]?.count || 0);

      const productsResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(and(inArray(products.tenantId, tenantIds), eq(products.isActive, true)));
      activeProducts = Number(productsResult[0]?.count || 0);

      const totalProductsResult = await this.db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(inArray(products.tenantId, tenantIds));
      totalProducts = Number(totalProductsResult[0]?.count || 0);

      const outletsForTenant = await this.db
        .select({ id: outlets.id })
        .from(outlets)
        .where(inArray(outlets.tenantId, tenantIds));
      const outletIds = outletsForTenant.map((o) => o.id);

      if (outletIds.length > 0) {
        const cashiersResult = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(usersTable)
          .where(
            and(
              inArray(usersTable.outletId, outletIds),
              eq(usersTable.role, 'cashier'),
              eq(usersTable.banned, false),
            ),
          );
        activeCashiers = Number(cashiersResult[0]?.count || 0);
      }
    }

    return {
      totalPenjualan: Number(result[0]?.totalRevenue || 0),
      totalTransaksi: Number(result[0]?.totalOrders || 0),
      totalPajak: Number(result[0]?.totalTax || 0),
      totalDiskon: Number(result[0]?.totalDiscount || 0),
      rataTransaksi: Number(result[0]?.averageOrder || 0),
      cabangAktif: activeOutlets,
      kasirAktif: activeCashiers,
      produkAktif: activeProducts,
      totalCabang: totalOutlets,
      totalProduk: totalProducts,
    };
  }

  private async getTenantIds(user: CurrentUserType, tenantId?: string): Promise<string[]> {
    if (tenantId) {
      return [tenantId];
    }

    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      if (userTenants.length > 0) {
        return userTenants.map((t) => t.id);
      }
    }

    return [];
  }

  async getSalesTrend(query: DashboardQueryDto, user: CurrentUserType) {
    const dateConditions = this.buildDateConditions(query.startDate, query.endDate);
    const tenantCondition = await this.getTenantCondition(user, query.tenantId);
    const outletCondition = query.outletId ? eq(orders.outletId, query.outletId) : undefined;

    const whereCondition = and(dateConditions, tenantCondition, outletCondition);

    const result = await this.db
      .select({
        date: sql<string>`DATE(${orders.completedAt})`,
        totalRevenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(whereCondition, eq(orders.status, 'complete')))
      .groupBy(sql`DATE(${orders.completedAt})`)
      .orderBy(sql`DATE(${orders.completedAt})`);

    return result.map((row) => ({
      date: row.date,
      revenue: Number(row.totalRevenue),
      orders: Number(row.totalOrders),
    }));
  }

  async getSalesByBranch(query: DashboardQueryDto, user: CurrentUserType) {
    const dateConditions = this.buildDateConditions(query.startDate, query.endDate);
    const tenantCondition = await this.getTenantCondition(user, query.tenantId);
    const outletCondition = query.outletId ? eq(orders.outletId, query.outletId) : undefined;

    const whereCondition = and(dateConditions, tenantCondition, outletCondition);

    const result = await this.db
      .select({
        outletId: orders.outletId,
        outletName: outlets.nama,
        totalRevenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .leftJoin(outlets, eq(orders.outletId, outlets.id))
      .where(and(whereCondition, eq(orders.status, 'complete')))
      .groupBy(orders.outletId, outlets.nama)
      .orderBy(desc(sql`COALESCE(SUM(${orders.total}::numeric), 0)`));

    return result.map((row) => ({
      outletId: row.outletId,
      outletName: row.outletName,
      revenue: Number(row.totalRevenue),
      orders: Number(row.totalOrders),
    }));
  }

  async getSalesByPaymentMethod(query: DashboardQueryDto, user: CurrentUserType) {
    const dateConditions = this.buildDateConditions(query.startDate, query.endDate);
    const tenantCondition = await this.getTenantCondition(user, query.tenantId);
    const outletCondition = query.outletId ? eq(orders.outletId, query.outletId) : undefined;

    const whereCondition = and(dateConditions, tenantCondition, outletCondition);

    const result = await this.db
      .select({
        paymentMethodId: orders.paymentMethodId,
        paymentMethodName: paymentMethods.nama,
        totalRevenue: sql<number>`COALESCE(SUM(${orders.total}::numeric), 0)`,
        totalOrders: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .leftJoin(paymentMethods, eq(orders.paymentMethodId, paymentMethods.id))
      .where(and(whereCondition, eq(orders.status, 'complete')))
      .groupBy(orders.paymentMethodId, paymentMethods.nama)
      .orderBy(desc(sql`COALESCE(SUM(${orders.total}::numeric), 0)`));

    return result.map((row) => ({
      paymentMethodId: row.paymentMethodId,
      paymentMethodName: row.paymentMethodName || 'Unknown',
      revenue: Number(row.totalRevenue),
      orders: Number(row.totalOrders),
    }));
  }

  private async getTenantCondition(user: CurrentUserType, tenantId?: string) {
    if (tenantId) {
      return eq(orders.tenantId, tenantId);
    }

    if (user.role === 'owner') {
      const userTenants = await this.db.query.tenants.findMany({
        where: eq(tenants.userId, user.id),
      });
      if (userTenants.length > 0) {
        const userTenantIds = userTenants.map((t) => t.id);
        return inArray(orders.tenantId, userTenantIds);
      }
    }

    return undefined;
  }
}
