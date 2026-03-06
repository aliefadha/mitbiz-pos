import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { roles } from '@/db/schema';
import { user as usersTable } from '@/db/schema/auth-schema';
import { orders } from '@/db/schema/order-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { paymentMethods } from '@/db/schema/payment-method-schema';
import { products } from '@/db/schema/product-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { DashboardQueryDto } from './dto';

@Injectable()
export class DashboardService {
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

  async getStats(query: DashboardQueryDto, user: CurrentUserWithRole) {
    // Validate tenantId if provided
    if (query.tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, query.tenantId);
    }

    // Get effective tenant ID (single tenant per user)
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    // Admin must provide tenantId parameter
    if (!effectiveTenantId) {
      throw new BadRequestException('Admin must provide tenantId parameter');
    }

    const dateConditions = this.buildDateConditions(query.startDate, query.endDate);
    const outletCondition = query.outletId ? eq(orders.outletId, query.outletId) : undefined;

    const whereCondition = and(
      dateConditions,
      eq(orders.tenantId, effectiveTenantId),
      outletCondition,
    );

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

    // Get stats for the single tenant
    const outletsResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(outlets)
      .where(and(eq(outlets.tenantId, effectiveTenantId), eq(outlets.isActive, true)));
    const activeOutlets = Number(outletsResult[0]?.count || 0);

    const totalOutletsResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(outlets)
      .where(eq(outlets.tenantId, effectiveTenantId));
    const totalOutlets = Number(totalOutletsResult[0]?.count || 0);

    const productsResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(and(eq(products.tenantId, effectiveTenantId), eq(products.isActive, true)));
    const activeProducts = Number(productsResult[0]?.count || 0);

    const totalProductsResult = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.tenantId, effectiveTenantId));
    const totalProducts = Number(totalProductsResult[0]?.count || 0);

    // Count active cashiers
    let activeCashiers = 0;
    const outletsForTenant = await this.db
      .select({ id: outlets.id })
      .from(outlets)
      .where(eq(outlets.tenantId, effectiveTenantId));
    const outletIds = outletsForTenant.map((o) => o.id);

    if (outletIds.length > 0) {
      const [cashierRole] = await this.db
        .select({ id: roles.id })
        .from(roles)
        .where(eq(roles.name, 'cashier'))
        .limit(1);

      if (cashierRole) {
        const cashiersResult = await this.db
          .select({ count: sql<number>`count(*)` })
          .from(usersTable)
          .where(
            and(
              sql`${usersTable.outletId} IN (${sql.join(
                outletIds.map((id) => sql`${id}`),
                sql`, `,
              )})`,
              eq(usersTable.roleId, cashierRole.id),
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

  async getSalesTrend(query: DashboardQueryDto, user: CurrentUserWithRole) {
    // Validate tenantId if provided
    if (query.tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, query.tenantId);
    }

    // Get effective tenant ID (single tenant per user)
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    // Admin must provide tenantId parameter
    if (!effectiveTenantId) {
      throw new BadRequestException('Admin must provide tenantId parameter');
    }

    const dateConditions = this.buildDateConditions(query.startDate, query.endDate);
    const outletCondition = query.outletId ? eq(orders.outletId, query.outletId) : undefined;

    const whereCondition = and(
      dateConditions,
      eq(orders.tenantId, effectiveTenantId),
      outletCondition,
    );

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

  async getSalesByBranch(query: DashboardQueryDto, user: CurrentUserWithRole) {
    // Validate tenantId if provided
    if (query.tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, query.tenantId);
    }

    // Get effective tenant ID (single tenant per user)
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    // Admin must provide tenantId parameter
    if (!effectiveTenantId) {
      throw new BadRequestException('Admin must provide tenantId parameter');
    }

    const dateConditions = this.buildDateConditions(query.startDate, query.endDate);
    const outletCondition = query.outletId ? eq(orders.outletId, query.outletId) : undefined;

    const whereCondition = and(
      dateConditions,
      eq(orders.tenantId, effectiveTenantId),
      outletCondition,
    );

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

  async getSalesByPaymentMethod(query: DashboardQueryDto, user: CurrentUserWithRole) {
    // Validate tenantId if provided
    if (query.tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, query.tenantId);
    }

    // Get effective tenant ID (single tenant per user)
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    // Admin must provide tenantId parameter
    if (!effectiveTenantId) {
      throw new BadRequestException('Admin must provide tenantId parameter');
    }

    const dateConditions = this.buildDateConditions(query.startDate, query.endDate);
    const outletCondition = query.outletId ? eq(orders.outletId, query.outletId) : undefined;

    const whereCondition = and(
      dateConditions,
      eq(orders.tenantId, effectiveTenantId),
      outletCondition,
    );

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
}
