import { randomUUID } from 'node:crypto';
import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { DB_CONNECTION } from '@/db/db.module';
import { user as users } from '@/db/schema/auth-schema';
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
    // Step 1: minimal existence check
    const result = await this.db
      .select({ id: stockAdjustments.id, outletId: stockAdjustments.outletId })
      .from(stockAdjustments)
      .where(eq(stockAdjustments.id, id))
      .limit(1);

    if (!result || result.length === 0) {
      throw new NotFoundException(`Stock adjustment with ID ${id} not found`);
    }

    // Step 2: tenant access check via outlet
    const outletRow = await this.db
      .select({ tenantId: outlets.tenantId })
      .from(outlets)
      .where(eq(outlets.id, result[0].outletId))
      .limit(1);

    const hasAccess = await this.tenantAuth.canAccessTenant(user, outletRow[0].tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this stock adjustment');
    }

    // Step 3: enriched query with explicit joins
    const enriched = await this.db
      .select()
      .from(stockAdjustments)
      .leftJoin(products, eq(stockAdjustments.productId, products.id))
      .leftJoin(outlets, eq(stockAdjustments.outletId, outlets.id))
      .where(eq(stockAdjustments.id, id))
      .limit(1);

    const row = enriched[0];

    // Query user separately to avoid parameter shadowing
    const userRow = await this.db
      .select()
      .from(users)
      .where(eq(users.id, row.stock_adjustments.adjustedBy))
      .limit(1);

    return {
      ...row.stock_adjustments,
      product: row.products
        ? {
            id: row.products.id,
            nama: row.products.nama,
            sku: row.products.sku,
            tenantId: row.products.tenantId,
            categoryId: row.products.categoryId,
            hargaBeli: row.products.hargaBeli,
            hargaJual: row.products.hargaJual,
            unit: row.products.unit,
            minStockLevel: row.products.minStockLevel,
            enableMinStock: row.products.enableMinStock,
            enableStockTracking: row.products.enableStockTracking,
            isActive: row.products.isActive,
            createdAt: row.products.createdAt,
            updatedAt: row.products.updatedAt,
          }
        : null,
      outlet: row.outlets
        ? {
            id: row.outlets.id,
            nama: row.outlets.nama,
            kode: row.outlets.kode,
            alamat: row.outlets.alamat,
            noHp: row.outlets.noHp,
            tenantId: row.outlets.tenantId,
            isActive: row.outlets.isActive,
            createdAt: row.outlets.createdAt,
            updatedAt: row.outlets.updatedAt,
          }
        : null,
      user: userRow[0]
        ? {
            id: userRow[0].id,
            name: userRow[0].name,
            email: userRow[0].email,
            emailVerified: userRow[0].emailVerified,
            image: userRow[0].image,
            createdAt: userRow[0].createdAt,
            updatedAt: userRow[0].updatedAt,
            roleId: userRow[0].roleId,
            tenantId: userRow[0].tenantId,
            banned: userRow[0].banned,
            banReason: userRow[0].banReason,
            banExpires: userRow[0].banExpires,
            outletId: userRow[0].outletId,
          }
        : null,
    };
  }

  async create(data: CreateStockAdjustmentDto, user: CurrentUserWithRole): Promise<void> {
    // Verify product exists and is active
    const product = await this.db.query.products.findFirst({
      where: eq(products.id, data.productId),
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${data.productId} not found`);
    }

    if (!product.isActive) {
      throw new ForbiddenException('Product is inactive');
    }

    // Verify outlet exists and is active
    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, data.outletId),
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${data.outletId} not found`);
    }

    if (!outlet.isActive) {
      throw new ForbiddenException('Outlet is inactive');
    }

    // Validate tenant access via outlet (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, outlet.tenantId);

    // Verify outlet and product belong to same tenant
    if (outlet.tenantId !== product.tenantId) {
      throw new ForbiddenException('Product and outlet do not belong to the same tenant');
    }

    await this.db.insert(stockAdjustments).values({
      id: randomUUID(),
      ...data,
      adjustedBy: user.id,
    });

    const existingStock = await this.db.query.productStocks.findFirst({
      where: and(
        eq(productStocks.productId, data.productId),
        eq(productStocks.outletId, data.outletId),
      ),
    });

    if (existingStock) {
      const newQuantity = existingStock.quantity + data.quantity;
      if (newQuantity >= 0) {
        await this.db
          .update(productStocks)
          .set({
            quantity: newQuantity,
            updatedAt: new Date(),
          })
          .where(eq(productStocks.id, existingStock.id));
      }
      // If newQuantity < 0, skip stock update — keep as-is
    } else if (data.quantity >= 0) {
      await this.db.insert(productStocks).values({
        id: randomUUID(),
        productId: data.productId,
        outletId: data.outletId,
        quantity: data.quantity,
      });
    }
    // If no stock exists and adjustment is negative, skip stock creation
  }
}
