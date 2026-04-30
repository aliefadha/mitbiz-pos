import { randomUUID } from 'node:crypto';
import type { CurrentUserWithRole } from '@/common/decorators/current-user.decorator';
import { getProductIdsByTenant } from '@/common/utils/tenant-filter';
import { DB_CONNECTION } from '@/db/db.module';
import { categories } from '@/db/schema/category-schema';
import { outlets } from '@/db/schema/outlet-schema';
import { products } from '@/db/schema/product-schema';
import { productStocks } from '@/db/schema/stock-schema';
import type { DrizzleDB } from '@/db/type';
import { TenantAuthService } from '@/rbac/services/tenant-auth.service';
import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SQL, and, desc, eq, sql } from 'drizzle-orm';
import { CreateStockDto, StockQueryDto, UpdateStockDto } from './dto';

@Injectable()
export class StocksService {
  constructor(
    @Inject(DB_CONNECTION) private db: DrizzleDB,
    private readonly tenantAuth: TenantAuthService,
  ) {}

  async findAll(query: StockQueryDto, user: CurrentUserWithRole) {
    const { page = 1, limit = 10, productId, outletId, tenantId, isActive = true } = query;
    const offset = (page - 1) * limit;

    // Validate that query tenantId matches user's allowed tenant
    if (tenantId) {
      await this.tenantAuth.validateQueryTenantId(user, tenantId);
    }

    // Get effective tenant ID for the user (for filtering if no tenantId provided)
    const effectiveTenantId = await this.tenantAuth.getEffectiveTenantId(user);

    const conditions: SQL<unknown>[] = [];

    if (isActive !== undefined) {
      conditions.push(eq(productStocks.isActive, isActive));
    }

    if (productId) {
      conditions.push(eq(productStocks.productId, productId));
    }

    if (outletId) {
      conditions.push(eq(productStocks.outletId, outletId));
    }

    // Filter by tenant - use query tenantId if provided, otherwise use effective tenant
    const filterTenantId = tenantId || effectiveTenantId;
    if (filterTenantId) {
      const productIdList = await getProductIdsByTenant(this.db, filterTenantId);

      if (productIdList.length === 0) {
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
        sql`${productStocks.productId} IN (${sql.join(
          productIdList.map((id) => sql`${id}`),
          sql`, `,
        )})`,
      );
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [data, totalResult] = await Promise.all([
      this.db
        .select()
        .from(productStocks)
        .leftJoin(products, eq(productStocks.productId, products.id))
        .leftJoin(categories, eq(products.categoryId, categories.id))
        .leftJoin(outlets, eq(productStocks.outletId, outlets.id))
        .where(whereClause)
        .limit(limit)
        .offset(offset)
        .orderBy(desc(productStocks.updatedAt)),
      this.db.select({ count: sql<number>`count(*)` }).from(productStocks).where(whereClause),
    ]);

    const stocksWithRelations = data.map((row) => ({
      ...row.product_stocks,
      product: row.products
        ? {
            id: row.products.id,
            nama: row.products.nama,
            minStockLevel: row.products.minStockLevel,
            category: row.categories
              ? {
                  id: row.categories.id,
                  nama: row.categories.nama,
                }
              : null,
          }
        : null,
      outlet: row.outlets
        ? {
            id: row.outlets.id,
            nama: row.outlets.nama,
            kode: row.outlets.kode,
          }
        : null,
    }));

    const total = Number(totalResult[0]?.count || 0);

    return {
      data: stocksWithRelations,
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
      .select({ id: productStocks.id, productId: productStocks.productId })
      .from(productStocks)
      .where(eq(productStocks.id, id))
      .limit(1);

    if (!result || result.length === 0) {
      throw new NotFoundException(`Stock with ID ${id} not found`);
    }

    // Step 2: tenant access check via product
    const productRow = await this.db
      .select({ tenantId: products.tenantId })
      .from(products)
      .where(eq(products.id, result[0].productId))
      .limit(1);

    const hasAccess = await this.tenantAuth.canAccessTenant(user, productRow[0].tenantId);
    if (!hasAccess) {
      throw new ForbiddenException('You do not have access to this stock');
    }

    // Step 3: enriched query with explicit joins
    const enriched = await this.db
      .select()
      .from(productStocks)
      .leftJoin(products, eq(productStocks.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(outlets, eq(productStocks.outletId, outlets.id))
      .where(eq(productStocks.id, id))
      .limit(1);

    const row = enriched[0];

    return {
      ...row.product_stocks,
      product: row.products
        ? {
            id: row.products.id,
            nama: row.products.nama,
            sku: row.products.sku,
            minStockLevel: row.products.minStockLevel,
            tenantId: row.products.tenantId,
            category: row.categories
              ? {
                  id: row.categories.id,
                  nama: row.categories.nama,
                }
              : null,
          }
        : null,
      outlet: row.outlets
        ? {
            id: row.outlets.id,
            nama: row.outlets.nama,
            kode: row.outlets.kode,
          }
        : null,
    };
  }

  async findByProductAndOutlet(productId: string, outletId: string) {
    const result = await this.db
      .select()
      .from(productStocks)
      .leftJoin(products, eq(productStocks.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(outlets, eq(productStocks.outletId, outlets.id))
      .where(and(eq(productStocks.productId, productId), eq(productStocks.outletId, outletId)))
      .limit(1);

    const row = result[0];

    if (!row) {
      return null;
    }

    return {
      ...row.product_stocks,
      product: row.products
        ? {
            id: row.products.id,
            nama: row.products.nama,
            sku: row.products.sku,
            minStockLevel: row.products.minStockLevel,
            tenantId: row.products.tenantId,
            category: row.categories
              ? {
                  id: row.categories.id,
                  nama: row.categories.nama,
                }
              : null,
          }
        : null,
      outlet: row.outlets
        ? {
            id: row.outlets.id,
            nama: row.outlets.nama,
            kode: row.outlets.kode,
          }
        : null,
    };
  }

  async create(data: CreateStockDto, user: CurrentUserWithRole): Promise<void> {
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

    // Validate tenant access via product's tenant (permission already checked by guard)
    await this.tenantAuth.validateTenantOperation(user, product.tenantId);

    // Verify outlet exists, is active, and belongs to same tenant
    const outlet = await this.db.query.outlets.findFirst({
      where: eq(outlets.id, data.outletId),
    });

    if (!outlet) {
      throw new NotFoundException(`Outlet with ID ${data.outletId} not found`);
    }

    if (!outlet.isActive) {
      throw new ForbiddenException('Outlet is inactive');
    }

    if (outlet.tenantId !== product.tenantId) {
      throw new ForbiddenException('Outlet does not belong to the same tenant as the product');
    }

    const existingStock = await this.findByProductAndOutlet(data.productId, data.outletId);

    if (existingStock) {
      throw new ConflictException(`Stock telah dibuat`);
    }

    await this.db.insert(productStocks).values({
      id: randomUUID(),
      ...data,
    });
  }

  async update(id: string, data: UpdateStockDto, user: CurrentUserWithRole): Promise<void> {
    // findById already validates tenant access via product's tenant
    await this.findById(id, user);

    await this.db
      .update(productStocks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(productStocks.id, id));
  }

  async remove(id: string, user: CurrentUserWithRole): Promise<void> {
    // findById already validates tenant access via product's tenant
    await this.findById(id, user);

    await this.db
      .update(productStocks)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(productStocks.id, id));
  }
}
